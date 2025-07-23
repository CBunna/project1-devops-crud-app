pipeline {
    agent any
    
    environment {
        DOCKER_IMAGE = "devops-crud-app"
        DOCKER_TAG = "${env.BUILD_NUMBER}"
        SONAR_PROJECT_KEY = "project1-devops-crud-app"
        SONAR_HOST_URL = "http://192.168.0.73:9000" 
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo "✅ Code checked out successfully"
            }
        }
        
           
        stage('SonarQube Analysis') {
            environment {
                SONAR_TOKEN = credentials('SONAR_TOKEN')
            }
            steps {
                script {
                    def scannerHome = tool 'sonar-scanner' 
                    sh """
                        ${scannerHome}/bin/sonar-scanner \
                            -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                            -Dsonar.sources=src \
                            -Dsonar.tests=tests \
                            -Dsonar.host.url=${SONAR_HOST_URL} \
                            -Dsonar.token=${SONAR_TOKEN} \
                            -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                            -Dsonar.exclusions=**/node_modules/**,**/coverage/**
                    """
                }
                echo "✅ SonarQube analysis completed"
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    // Build images with proper tags for Docker Hub
                    dockerImage = docker.build("bunna44/${DOCKER_IMAGE}:${DOCKER_TAG}")
                    docker.build("bunna44/${DOCKER_IMAGE}:latest")
                }
                echo "✅ Docker image built successfully"
            }
        }
        
        stage('Security Scan') {
            steps {
                sh "docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v \$(pwd):/app aquasec/trivy image bunna44/${DOCKER_IMAGE}:${DOCKER_TAG}"
                echo "✅ Security scan completed"
            }
        }
        
        stage('Docker Build and Push') {
            steps {
                script {
                    // Login to Docker Hub and push images
                    withCredentials([usernamePassword(credentialsId: 'docker-red', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                        sh """
                            echo \$DOCKER_PASSWORD | docker login -u \$DOCKER_USERNAME --password-stdin
                            
                            # Push versioned image
                            docker push bunna44/${DOCKER_IMAGE}:${DOCKER_TAG}
                            
                            # Push latest image
                            docker push bunna44/${DOCKER_IMAGE}:latest
                            
                            echo "✅ Images pushed to Docker Hub successfully"
                        """
                    }
                }
                echo "✅ Docker build and push completed"
            }
        }


               stage('Run Container') {
            steps {
                script {
                    echo "🚀 Deploying container to staging environment..."
                    
                    // 🔧 FIX: Add withCredentials to get database variables
                    withCredentials([
                        string(credentialsId: 'db-host', variable: 'DB_HOST'),
                        string(credentialsId: 'db-user', variable: 'DB_USER'),
                        string(credentialsId: 'db-password', variable: 'DB_PASSWORD'),
                        string(credentialsId: 'db-name', variable: 'DB_NAME')
                    ]) {
                        try {
                            // Stop and remove any existing container
                            sh """
                                echo "🧹 Cleaning up existing containers..."
                                docker stop ${DOCKER_IMAGE}-staging || true
                                docker rm ${DOCKER_IMAGE}-staging || true
                            """
                            
                            // Pull the latest image from Docker Hub
                            sh """
                                echo "📥 Pulling latest image from Docker Hub..."
                                docker pull bunna44/${DOCKER_IMAGE}:${DOCKER_TAG}
                            """
                            
                            // Run the container with database credentials
                            sh """
                                echo "🏃 Starting container with database connection..."
                                echo "Database Host: \${DB_HOST}"
                                echo "Database Name: \${DB_NAME}"
                                
                                docker run -d \
                                    --name ${DOCKER_IMAGE}-staging \
                                    -p 3001:3000 \
                                    -e NODE_ENV=staging \
                                    -e DB_HOST=\${DB_HOST} \
                                    -e DB_PORT=3306 \
                                    -e DB_USER=\${DB_USER} \
                                    -e DB_PASSWORD=\${DB_PASSWORD} \
                                    -e DB_NAME=\${DB_NAME} \
                                    -e DB_SSL=true \
                                    --restart unless-stopped \
                                    bunna44/${DOCKER_IMAGE}:${DOCKER_TAG}
                            """
                            
                            // Wait for container to start
                            echo "⏳ Waiting for container to start and connect to database..."
                            sleep(time: 60, unit: "SECONDS")
                            
                            // Health check with retries
                            echo "🔍 Performing health checks..."
                            sh """
                                # Check if container is running
                                if ! docker ps | grep ${DOCKER_IMAGE}-staging; then
                                    echo "❌ Container is not running"
                                    docker ps -a | grep ${DOCKER_IMAGE}-staging || true
                                    exit 1
                                fi
                                echo "✅ Container is running"
                                
                                # Check container logs
                                echo "📋 Recent container logs:"
                                docker logs ${DOCKER_IMAGE}-staging --tail 30
                                
                                # Health check endpoint with retries
                                echo "🔍 Testing health endpoint (with retries for database connection)..."
                                for i in {1..15}; do
                                    if curl -f -s http://localhost:3001/health; then
                                        echo "✅ Health check passed (attempt \$i)"
                                        break
                                    else
                                        echo "⏳ Health check attempt \$i/15... (waiting for database connection)"
                                        if [ \$i -eq 15 ]; then
                                            echo "❌ Health check failed after 15 attempts"
                                            docker logs ${DOCKER_IMAGE}-staging --tail 50
                                            exit 1
                                        fi
                                        sleep 10
                                    fi
                                done
                                
                                # Test API endpoints
                                curl -f http://localhost:3001/api/tasks || exit 1
                                echo "✅ API endpoints accessible"
                            """
                            
                            echo "✅ Container deployed and verified successfully!"
                            echo "🌐 Application available at: http://localhost:3001"
                            echo "🔗 Health check: http://localhost:3001/health"
                            echo "📡 API: http://localhost:3001/api/tasks"
                            
                        } catch (Exception e) {
                            echo "❌ Container deployment failed: ${e.getMessage()}"
                            
                            // Enhanced debugging
                            sh """
                                echo "🔍 Debugging container issues..."
                                
                                echo "=== Container Status ==="
                                docker ps -a | grep ${DOCKER_IMAGE} || echo "No containers found"
                                
                                echo "=== Container Logs ==="
                                docker logs ${DOCKER_IMAGE}-staging --tail 100 || echo "No logs available"
                                
                                echo "=== Database Connection Test ==="
                                if [ -n "\${DB_HOST}" ]; then
                                    echo "Testing connection to \${DB_HOST}:3306..."
                                    nc -z \${DB_HOST} 3306 && echo "✅ Can reach database" || echo "❌ Cannot reach database"
                                else
                                    echo "❌ DB_HOST not set"
                                fi
                                
                                echo "=== Environment Check ==="
                                echo "DB_HOST is set: \${DB_HOST:+yes}"
                                echo "DB_USER is set: \${DB_USER:+yes}"
                                echo "DB_NAME is set: \${DB_NAME:+yes}"
                            """
                            
                            throw e
                        }
                    }
                }
            }
        }
    
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to Production?', ok: 'Deploy'
                
                script {
                    // Production deployment logic here
                    // This could involve pushing to a registry, updating Kubernetes manifests, etc.
                    sh """
                        docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_IMAGE}:production
                        echo "Tagged image for production deployment"
                    """
                }
                echo "✅ Deployed to production"
            }
        }
    }
}
