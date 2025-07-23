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
                        
                        // Run the container
                        sh """
                            echo "🏃 Starting container..."
                            docker run -d \
                                --name ${DOCKER_IMAGE}-staging \
                                -p 3001:3000 \
                                -e NODE_ENV=staging \
                                -e DB_HOST=\${DB_HOST} \
                                -e DB_PORT=\${DB_PORT:-3306} \
                                -e DB_USER=\${DB_USER} \
                                -e DB_PASSWORD=\${DB_PASSWORD} \
                                -e DB_NAME=\${DB_NAME} \
                                -e DB_SSL=\${DB_SSL:-true} \
                                --restart unless-stopped \
                                bunna44/${DOCKER_IMAGE}:${DOCKER_TAG}
                        """
                        
                        // Wait for container to start
                        echo "⏳ Waiting for container to start..."
                        sleep(time: 30, unit: "SECONDS")
                        
                        // Health check
                        echo "🔍 Performing health checks..."
                        sh """
                            # Check if container is running
                            docker ps | grep ${DOCKER_IMAGE}-staging || exit 1
                            echo "✅ Container is running"
                            
                            # Check container logs
                            echo "📋 Recent container logs:"
                            docker logs ${DOCKER_IMAGE}-staging --tail 20
                            
                            # Health check endpoint
                            curl -f http://localhost:3001/health || exit 1
                            echo "✅ Health check passed"
                            
                            # Test API endpoints
                            curl -f http://localhost:3001/api/tasks || exit 1
                            echo "✅ API endpoints accessible"
                        """
                        
                        echo "✅ Container deployed and verified successfully!"
                        echo "🌐 Application available at: http://localhost:3001"
                        
                    } catch (Exception e) {
                        echo "❌ Container deployment failed: ${e.getMessage()}"
                        
                        // Show container logs for debugging
                        sh """
                            echo "🔍 Debugging container issues..."
                            docker logs ${DOCKER_IMAGE}-staging --tail 50 || echo "No logs available"
                            docker ps -a | grep ${DOCKER_IMAGE} || echo "No containers found"
                        """
                        
                        throw e
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
