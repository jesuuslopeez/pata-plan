# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in PataPlan, please report it responsibly. **Do not open a public issue.**

Instead, please send an email to **jesuuslopeezp@gmail.com** with the following information:

- A description of the vulnerability
- Steps to reproduce the issue
- The potential impact of the vulnerability
- Any suggested fix (if applicable)

## Response Timeline

- **Acknowledgment**: We will acknowledge receipt of your report within **48 hours**.
- **Assessment**: We will provide an initial assessment within **5 business days**.
- **Resolution**: We aim to resolve confirmed vulnerabilities within **30 days**, depending on complexity.

## Scope

The following are considered in scope:

- Authentication and authorization bypass
- SQL injection or other injection attacks
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- Sensitive data exposure
- Server-side request forgery (SSRF)

The following are **out of scope**:

- Denial of service (DoS) attacks
- Social engineering
- Issues in third-party dependencies (please report these to the respective maintainers)

## Security Best Practices Applied

This project implements the following security measures:

- **Helmet.js** for HTTP security headers
- **CORS** configured to allow only trusted origins
- **Rate limiting** to prevent brute force attacks
- **JWT-based authentication** with secure token handling
- **Input validation and sanitization** on all endpoints
- **Environment variables** for all sensitive configuration (never hardcoded)
- **Dependency auditing** via Dependabot

## Acknowledgments

We appreciate the efforts of security researchers and the community in helping keep PataPlan and its users safe.
