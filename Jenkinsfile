pipeline {
  agent any

  tools {
    nodejs 'NodeJS 20'
  }

  options {
    timestamps()
    disableConcurrentBuilds()
    skipDefaultCheckout(true)
  }

  triggers {
    githubPush()
  }

  parameters {
    string(
      name: 'API_BASE_URL',
      defaultValue: '',
      description: 'Deployed backend base URL, for example https://your-render-service.onrender.com'
    )
    booleanParam(
      name: 'RUN_DEPLOY',
      defaultValue: false,
      description: 'Run the deploy stage before triggering post-deploy automation.'
    )
    booleanParam(
      name: 'RUN_APP_CI',
      defaultValue: false,
      description: 'Run this repository install, test, and build stages before triggering automation.'
    )
    booleanParam(
      name: 'RUN_API_AUTOMATION',
      defaultValue: true,
      description: 'Trigger the downstream Jenkins API automation job on main.'
    )
    booleanParam(
      name: 'RUN_FE_AUTOMATION',
      defaultValue: true,
      description: 'Trigger the downstream Jenkins frontend automation job on main.'
    )
    string(
      name: 'API_AUTOMATION_JOB',
      defaultValue: 'be-automation',
      description: 'Jenkins job name that runs the separate API automation repository.'
    )
    string(
      name: 'FE_AUTOMATION_JOB',
      defaultValue: 'fe-automation',
      description: 'Jenkins job name that runs the separate frontend automation repository.'
    )
  }

  environment {
    CI = 'true'
  }

  stages {
    stage('Checkout') {
      steps {
        deleteDir()
        checkout scm
      }
    }

    stage('Verify Backend Test Setup') {
      when {
        expression { return params.RUN_APP_CI }
      }
      steps {
        script {
          runCommand(
            'test -f backend/src/__tests__/setupEnv.js && ls -la backend/src/__tests__',
            'if exist backend\\src\\__tests__\\setupEnv.js (dir backend\\src\\__tests__) else (echo setupEnv.js missing & exit /b 1)'
          )
        }
      }
    }

    stage('Install Backend') {
      when {
        expression { return params.RUN_APP_CI }
      }
      steps {
        dir('backend') {
          script {
            runCommand('npm ci')
            runCommand('npx prisma generate')
          }
        }
      }
    }

    stage('Install Frontend') {
      when {
        expression { return params.RUN_APP_CI }
      }
      steps {
        dir('frontend') {
          script {
            runCommand('npm ci')
          }
        }
      }
    }

    stage('Backend API Tests') {
      when {
        expression { return params.RUN_APP_CI }
      }
      steps {
        dir('backend') {
          script {
            runCommand(
              'JWT_SECRET=test-secret-for-unit-tests npm run test:ci',
              'set JWT_SECRET=test-secret-for-unit-tests && npm run test:ci'
            )
          }
        }
      }
    }

    stage('Frontend Tests') {
      when {
        expression { return params.RUN_APP_CI }
      }
      steps {
        dir('frontend') {
          script {
            runCommand('npm run test:ci')
          }
        }
      }
    }

    stage('Frontend Build') {
      when {
        expression { return params.RUN_APP_CI }
      }
      steps {
        dir('frontend') {
          script {
            runCommand('npm run build')
          }
        }
      }
    }

    stage('Deploy') {
      when {
        expression { return params.RUN_DEPLOY }
      }
      steps {
        echo 'Add your deployment command here, or trigger this Jenkins job after Render/Vercel deployment finishes.'
      }
    }

    stage('Post-Deploy API Smoke Test') {
      when {
        expression { return params.API_BASE_URL?.trim() }
      }
      steps {
        script {
          runCommand(
            'node scripts/api-smoke-test.js "$API_BASE_URL"',
            'node scripts\\api-smoke-test.js "%API_BASE_URL%"'
          )
        }
      }
    }

    stage('Trigger API Automation') {
      when {
        expression { return params.RUN_API_AUTOMATION }
      }
      steps {
        script {
          echo "Triggering API automation job: ${params.API_AUTOMATION_JOB}"
          build job: params.API_AUTOMATION_JOB,
            parameters: [
              string(name: 'API_BASE_URL', value: params.API_BASE_URL ?: '')
            ],
            wait: true,
            propagate: true
        }
      }
    }

    stage('Trigger Frontend Automation') {
      when {
        expression { return params.RUN_FE_AUTOMATION }
      }
      steps {
        script {
          echo "Triggering frontend automation job: ${params.FE_AUTOMATION_JOB}"
          build job: params.FE_AUTOMATION_JOB,
            wait: true,
            propagate: true
        }
      }
    }
  }
}

void runCommand(String unixCommand, String windowsCommand = null) {
  if (isUnix()) {
    sh unixCommand
  } else {
    bat windowsCommand ?: unixCommand
  }
}
