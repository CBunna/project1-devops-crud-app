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
                echo "Code checked out"
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
                            -Dsonar.host.url=${SONAR_HOST_URL} \
                            -Dsonar.token=${SONAR_TOKEN}
                    """
                }
                echo "SonarQube analysis completed"
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    docker.build("bunna44/${DOCKER_IMAGE}:${DOCKER_TAG}")
                    docker.build("bunna44/${DOCKER_IMAGE}:latest")
                }
                echo "Docker image built"
            }
        }
        
        stage('Security Scan') {
            steps {
                sh "docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image bunna44/${DOCKER_IMAGE}:${DOCKER_TAG}"
                echo "Security scan completed"
            }
        }
        
        stage('Push to Docker Hub') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'docker-red', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                        sh """
                            echo \$DOCKER_PASSWORD | docker login -u \$DOCKER_USERNAME --password-stdin
                            docker push bunna44/${DOCKER_IMAGE}:${DOCKER_TAG}
                            docker push bunna44/${DOCKER_IMAGE}:latest
                        """
                    }
                }
                echo "Docker images pushed"
            }
        }

        stage('Deploy') {
            steps {
                script {
                    withCredentials([
                        string(credentialsId: 'db-host', variable: 'DB_HOST'),
                        string(credentialsId: 'db-user', variable: 'DB_USER'),
                        string(credentialsId: 'db-password', variable: 'DB_PASSWORD'),
                        string(credentialsId: 'db-name', variable: 'DB_NAME')
                    ]) {
                        sh """
                            docker stop ${DOCKER_IMAGE}-staging || true
                            docker rm ${DOCKER_IMAGE}-staging || true
                            
                            docker run -d \
                                --name ${DOCKER_IMAGE}-staging \
                                -p 3001:3000 \
                                -e DB_HOST=\${DB_HOST} \
                                -e DB_USER=\${DB_USER} \
                                -e DB_PASSWORD=\${DB_PASSWORD} \
                                -e DB_NAME=\${DB_NAME} \
                                bunna44/${DOCKER_IMAGE}:${DOCKER_TAG}
                            
                            sleep 30
                            curl -f http://localhost:3001/health
                        """
                    }
                }
                echo "Application deployed"
            }
        }
    }
}
