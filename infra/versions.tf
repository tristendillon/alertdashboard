terraform {
  required_version = ">= 1.8"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.21"
    }
  }

  # State lives in the Cloudflare R2 bucket `sizeup-tofu-state` via the S3-compatible
  # backend. This is a PARTIAL backend config: no account-specific values are committed
  # here. Supply the remaining fields at init time with:
  #
  #   tofu init -backend-config=backend.hcl
  #
  # See backend.hcl.example (copy to backend.hcl, fill in <ACCOUNT_ID>) and infra/README.md.
  #
  # R2 requires the S3 flags below to skip AWS-isms; use_lockfile enables the native
  # S3 conditional-write lock (no DynamoDB table needed).
  backend "s3" {
    bucket = "sizeup-tofu-state"
    key    = "infra/terraform.tfstate"
    region = "auto"

    use_lockfile                = true
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_s3_checksum            = true
    # endpoints.s3 comes from backend.hcl:
    #   https://<ACCOUNT_ID>.r2.cloudflarestorage.com
  }
}
