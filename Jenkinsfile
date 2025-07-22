pipeline {
    agent any
    
    environment {
        DOCKER_IMAGE = "devops-crud-app"
        DOCKER_TAG = "${env.BUILD_NUMBER}"
        SCANNER_HOME = tool 'sonar-scanner'
        SONAR_PROJECT_KEY = "project1-devops-crud-app"
        SONAR_HOST_URL = credentials('host-url')
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
                SONAR_TOKEN = credentials('sonar-token')
            }
            steps {
                script {
                    def scannerHome = tool 'SonarQubeScanner' 
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
                sh "docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v \$(pwd):/app aquasec/trivy image ${DOCKER_IMAGE}:${DOCKER_TAG}"
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
