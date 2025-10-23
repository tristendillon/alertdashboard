terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  required_version = ">= 1.6.0"
}

provider "aws" {
  region = "us-east-1"
}


module "sync_firstdue_alerts" {
  source = "./lambdas/sync-firstdue-alerts"

  lambda_zip = "${path.root}/../lambdas/sync-firstdue-alerts/sync-firstdue-alerts.zip"
}
