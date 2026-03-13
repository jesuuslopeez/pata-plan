# Contributing to PataPlan

Thank you for your interest in contributing to PataPlan! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Style Guide](#style-guide)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/pata-plan.git
   cd pata-plan
   ```
3. Copy the environment variables file and configure it:
   ```bash
   cp .env.example .env
   ```
4. Install dependencies:
   ```bash
   # Backend
   cd server
   npm install

   # Frontend
   cd ../client
   npm install
   ```
5. Start the development environment:
   ```bash
   docker compose up -d
   ```

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue using the **Bug Report** template. Include as much detail as possible:

- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Your environment (browser, OS, Node.js version)

### Suggesting Features

If you have an idea for a new feature, please open an issue using the **Feature Request** template. Describe:

- The problem your feature would solve
- Your proposed solution
- Any alternatives you have considered

### Submitting Code

1. Check that there is an open issue for the work you want to do
2. Comment on the issue to let others know you are working on it
3. Follow the [Development Workflow](#development-workflow) below

## Development Workflow

1. Create a new branch from `main`:
   ```bash
   git checkout -b feature/short-description
   ```
2. Use the following branch naming convention:
   - `feature/description` for new features
   - `fix/description` for bug fixes
   - `docs/description` for documentation changes
   - `refactor/description` for code refactoring
3. Make your changes in small, focused commits
4. Write or update tests as needed
5. Ensure all tests pass before submitting:
   ```bash
   npm test
   ```
6. Push your branch and open a Pull Request

## Commit Convention

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification. Each commit message should be structured as:

```
type(scope): short description

Optional longer description
```

### Types

| Type       | Description                                      |
| ---------- | ------------------------------------------------ |
| `feat`     | A new feature                                    |
| `fix`      | A bug fix                                        |
| `docs`     | Documentation changes only                       |
| `style`    | Code style changes (formatting, semicolons, etc) |
| `refactor` | Code changes that neither fix a bug nor add a feature |
| `test`     | Adding or updating tests                         |
| `chore`    | Maintenance tasks (dependencies, config, etc)    |
| `ci`       | CI/CD configuration changes                      |

### Examples

```
feat(auth): add JWT-based login endpoint
fix(dashboard): correct priority score calculation
docs(readme): update installation instructions
chore(deps): upgrade express to v4.19
```

## Pull Request Process

1. Fill in the Pull Request template completely
2. Link the related issue(s)
3. Ensure your branch is up to date with `main`
4. Verify that all CI checks pass
5. Request a review if applicable
6. Do not merge your own Pull Request unless you are the sole maintainer

## Style Guide

### General

- Write all code, variables, comments, and documentation in **English**
- Use meaningful and descriptive names for variables, functions, and files

### JavaScript / Node.js

- Use ES6+ syntax
- Use `const` by default, `let` when reassignment is needed, never `var`
- Use arrow functions where appropriate
- Use async/await over raw Promises

### React

- Use functional components with hooks
- Keep components small and focused on a single responsibility
- Place reusable components in a shared `components` directory

### CSS / SASS

- Use SASS with a modular structure
- Follow BEM naming convention for class names
- Avoid inline styles

### File and Folder Naming

- Use lowercase with hyphens for folders: `user-profile/`
- Use PascalCase for React components: `UserProfile.jsx`
- Use camelCase for utility files: `formatDate.js`
