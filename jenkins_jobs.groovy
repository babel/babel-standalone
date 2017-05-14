// Jenkins build jobs for babel-standalone

job('babel-standalone-update') {
  description 'Updates babel-standalone to the latest version of Babel'
  label 'powershell'
  scm {
    git {
      branch 'master'
      remote {
        github 'babel/babel-standalone', 'ssh'
      }
      extensions {
        // Required so we can commit to master
        // http://stackoverflow.com/a/29786580/210370
        localBranch 'master'
      }
    }
  }
  triggers {
    urlTrigger {
      cron 'H/30 * * * *'
      url('https://babel-standalone.dan.cx/latest-babel-version') {
        inspection 'change'
      }
    }
  }

  wrappers {
    credentialsBinding {
      string 'GITHUB_TOKEN', 'BABEL_STANDALONE_GITHUB_TOKEN'
    }
  }
  steps {
    powerShell '''
      $Env:GITHUB_USER = 'babel'
      $Env:GITHUB_REPO = 'babel-standalone'
      .\\scripts\\update.ps1
    '''
  }
  publishers {
    git {
      branch 'origin', 'master'
      pushOnlyIfSuccess
    }
    gitHubIssueNotifier {
    }
  }
}
