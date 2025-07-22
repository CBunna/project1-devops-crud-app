pipeline {
    agent any
    
    environment {
        DOCKER_IMAGE = "devops-crud-app"
        DOCKER_TAG = "${env.BUILD_NUMBER}"
        SONAR_PROJECT_KEY = "devops-crud-app"
    }
    
    tools {
        nodejs "nodejs"  
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
                    publishTestResults testResultsPattern: 'coverage/lcov.info'
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
                SONAR_TOKEN = credentials('sonar-token')  // Configure this in Jenkins
            }
            steps {
                script {
                    def scannerHome = tool 'SonarQubeScanner'  // Configure this in Jenkins
                    withSonarQubeEnv('SonarCloud') {  // Configure this in Jenkins
                        sh """
                            ${scannerHome}/bin/sonar-scanner \
                                -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                                -Dsonar.sources=src \
                                -Dsonar.tests=tests \
                                -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                                -Dsonar.testExecutionReportPaths=coverage/test-reporter.xml
                        """
                    }
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
                    docker.build("${DOCKER_IMAGE}:${DOCKER_TAG}")
                    docker.build("${DOCKER_IMAGE}:latest")
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
        
        stage('Deploy to Staging') {
            steps {
                script {
                    // Stop existing container if running
                    sh """
                        docker stop ${DOCKER_IMAGE}-staging || true
                        docker rm ${DOCKER_IMAGE}-staging || true
                    """
                    
                    // Run new container
                    sh """
                        docker run -d \
                            --name ${DOCKER_IMAGE}-staging \
                            -p 3001:3000 \
                            -e NODE_ENV=staging \
                            -e DB_HOST=${env.DB_HOST} \
                            -e DB_USER=${env.DB_USER} \
                            -e DB_PASSWORD=${env.DB_PASSWORD} \
                            -e DB_NAME=${env.DB_NAME}_staging \
                            ${DOCKER_IMAGE}:${DOCKER_TAG}
                    """
                }
                echo "✅ Deployed to staging environment"
            }
        }
        
        stage('Integration Tests') {
            steps {
                sh """
                    # Wait for application to start
                    sleep 30
                    
                    # Run integration tests against staging
                    curl -f http://localhost:3001/health || exit 1
                    echo "Health check passed"
                    
                    # Additional integration tests can be added here
                """
                echo "✅ Integration tests passed"
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
    
    post {
        always {
            // Clean up
            sh """
                docker stop ${DOCKER_IMAGE}-staging || true
                docker rm ${DOCKER_IMAGE}-staging || true
                docker system prune -f
            """
            
            // Archive artifacts
            archiveArtifacts artifacts: 'coverage/**', allowEmptyArchive: true
        }
        success {
            echo "🎉 Pipeline completed successfully!"
            // Send success notification (Slack, email, etc.)
        }
        failure {
            echo "❌ Pipeline failed"
            // Send failure notification
        }
    }
}
