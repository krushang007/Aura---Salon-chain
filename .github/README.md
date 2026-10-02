# GitHub Actions CI/CD Configuration Guide

This repository uses automated GitHub Actions workflows for continuous integration, Docker image building/pushing to Amazon ECR, and deployment to AWS EC2.

---

## 1. Workflows Overview

| Workflow | File | Trigger | Description |
| :--- | :--- | :--- | :--- |
| **CI (Quality Checks)** | [`.github/workflows/ci.yml`](file:///Users/krushang/Desktop/Test/Booking/.github/workflows/ci.yml) | Pull Request (`main`, `develop`), Push (`develop`) | Runs linting, type checks, and validates production builds. |
| **Build & Push App** | [`.github/workflows/build-app.yml`](file:///Users/krushang/Desktop/Test/Booking/.github/workflows/build-app.yml) | Push to `main`, `workflow_dispatch` | Authenticates with AWS, builds multi-stage Docker image, tags with Git commit SHA and `latest`, and pushes to Amazon ECR. |
| **Deploy to EC2** | [`.github/workflows/deploy-ec2.yml`](file:///Users/krushang/Desktop/Test/Booking/.github/workflows/deploy-ec2.yml) | `workflow_dispatch` (Manual with `imageTag` input) | Connects via SSH to AWS EC2, updates `.env`, pulls target image tag, and performs zero-downtime service reload via Docker Compose. |

---

## 2. Secrets vs. Variables Configuration

To configure the pipelines in your GitHub repository, go to **Settings** > **Secrets and variables** > **Actions**.

### A. Repository Secrets (`${{ secrets.* }}`)
> **Sensitive / Critical Credentials** — encrypted at rest and masked in logs:

* **`AWS_ACCESS_KEY_ID`**: IAM user access key with ECR push/pull permissions.
* **`AWS_SECRET_ACCESS_KEY`**: IAM user secret access key.
* **`VM_SSH_KEY`**: Private OpenSSH key (`PEM` or `id_ed25519` / `id_rsa`) authorized to access the EC2 instance.
* *(Optional)* `POSTGRES_PASSWORD`: Production database master password.

### B. Repository Variables (`${{ vars.* }}`)
> **Non-Critical Configuration Values** — accessible in plaintext configuration:

* **`AWS_REGION`**: AWS target region (e.g. `ap-south-1` or `us-east-1`).
* **`ECR_REGISTRY`**: Amazon ECR registry domain (e.g. `123456789012.dkr.ecr.ap-south-1.amazonaws.com`).
* **`ECR_REPOSITORY`**: Repository name on Amazon ECR (e.g. `salon-booking-app`).
* **`VM_HOST`**: Elastic IP or Public DNS of the AWS EC2 instance.
* **`VM_USERNAME`**: SSH login user (default: `ubuntu`).
* **`VM_SSH_PORT`**: SSH port (default: `22`).
