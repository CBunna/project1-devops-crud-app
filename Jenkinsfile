pipeline {
    agent any
    
    environment {
        DOCKER_IMAGE = "devops-crud-app"
        DOCKER_TAG = "${env.BUILD_NUMBER}"
        SONAR_PROJECT_KEY = "project1-devops-crud-app"
        SONAR_HOST_URL = "http://192.168.0.73:9000"  // Direct URL instead of credential
    }
    
    tools {
        nodejs "nodejs"  // Make sure this matches your Jenkins Global Tools config
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo "✅ Code checked out successfully"
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm clean-install'
                echo "✅ Dependencies installed"
            }
        }
        
        stage('Run Tests') {
            steps {
                sh 'npm test'
                echo "✅ Tests completed"
            }
            post {
                always {
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'coverage',
                        reportFiles: 'index.html',
                        reportName: 'Coverage Report'
                    ])
                }
            }
        }
           
        stage('SonarQube Analysis') {
            environment {
                SONAR_TOKEN = credentials('sonar-token')
            }
            steps {
                script {
                    // Use consistent tool name - check your Jenkins Global Tools config
                    def scannerHome = tool 'SonarQubeScanner'  // Make sure this matches your tool name
                    
                    echo "Scanner Home: ${scannerHome}"
                    echo "SonarQube URL: ${SONAR_HOST_URL}"
                    echo "Project Key: ${SONAR_PROJECT_KEY}"
                    
                    sh """
                        echo "🔍 Starting SonarQube Analysis..."
                        echo "Scanner path: ${scannerHome}/bin/sonar-scanner"
                        ls -la ${scannerHome}/bin/
                        
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
        
        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
                echo "✅ Quality gate passed"
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    echo "🐳 Building Docker images..."
                    // Build images with proper tags for Docker Hub
                    dockerImage = docker.build("bunna44/${DOCKER_IMAGE}:${DOCKER_TAG}")
                    docker.build("bunna44/${DOCKER_IMAGE}:latest")
                }
                echo "✅ Docker image built successfully"
            }
        }
        
        stage('Security Scan') {
            steps {
                script {
                    echo "🔒 Running security scan..."
                    // Use correct image name with bunna44 prefix
                    sh "docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v \$(pwd):/app aquasec/trivy image bunna44/${DOCKER_IMAGE}:${DOCKER_TAG}"
                }
                echo "✅ Security scan completed"
            }
        }
        
        stage('Docker Build and Push') {
            steps {
                script {
                    echo "📦 Pushing to Docker Hub..."
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
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to Production?', ok: 'Deploy'
                
                script {
                    sh """
                        docker tag bunna44/${DOCKER_IMAGE}:${DOCKER_TAG} bunna44/${DOCKER_IMAGE}:production
                        echo "Tagged image for production deployment"
                    """
                }
                echo "✅ Deployed to production"
            }
        }
    }
    
    post {
        always {
            echo "🧹 Cleaning up..."
            sh """
                # Clean up local images to save space
                docker rmi bunna44/${DOCKER_IMAGE}:${DOCKER_TAG} || true
                docker system prune -f
            """
        }
        success {
            echo "🎉 Pipeline completed successfully!"
            echo "📦 Images available: bunna44/${DOCKER_IMAGE}:${DOCKER_TAG}"
        }
        failure {
            echo "❌ Pipeline failed"
            echo "Check the logs above for error details"
        }
    }
}