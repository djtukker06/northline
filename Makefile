# A Makefile is a small command catalogue. `make up` is easier to remember and
# harder to get wrong than the full docker compose invocation, and it documents
# the project's common operations in one place.

.DEFAULT_GOAL := help
.PHONY: help setup up down restart logs shell db redis migrate fresh seed key test lint cache-clear ps

help: ## Show the available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

setup: ## First-time setup: env file, build, start, install, migrate, seed
	@test -f .env || (cp .env.example .env && echo "created .env from .env.example")
	docker compose build
	docker compose up -d
	@echo "waiting for the database to accept connections..."
	@until docker compose exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; do sleep 2; done
	docker compose exec -T php composer install --no-interaction
	docker compose exec -T php php artisan key:generate --force
	docker compose exec -T php php artisan migrate --force
	docker compose exec -T php php artisan db:seed --force
	@echo ""
	@echo "API ready:      http://localhost:8080/api/v1/health"
	@echo "Try a request:  curl -H 'X-API-Key: nl_dev_dashboard_2f8c41d9b7e64a05' http://localhost:8080/api/v1/kpis"

up: ## Start all containers in the background
	docker compose up -d

down: ## Stop and remove the containers (data in volumes survives)
	docker compose down

restart: ## Restart every container
	docker compose restart

ps: ## Show container status
	docker compose ps

logs: ## Follow the logs of every container
	docker compose logs -f --tail=100

shell: ## Open a shell inside the php container
	docker compose exec php sh

db: ## Open a MySQL client on the northline database
	docker compose exec mysql mysql -u$${DB_USERNAME:-northline} -p$${DB_PASSWORD:-secret} $${DB_DATABASE:-northline}

redis: ## Open a redis-cli session
	docker compose exec redis redis-cli

migrate: ## Run any migrations that have not run yet
	docker compose exec -T php php artisan migrate

fresh: ## Drop every table, migrate from scratch and reseed. Destroys all data.
	docker compose exec -T php php artisan migrate:fresh --seed

seed: ## Run the seeders again
	docker compose exec -T php php artisan db:seed

key: ## Generate a new APP_KEY
	docker compose exec -T php php artisan key:generate

test: ## Run the PHPUnit test suite
	docker compose exec -T php php artisan test

lint: ## Check code style with Laravel Pint
	docker compose exec -T php ./vendor/bin/pint --test

cache-clear: ## Drop the application cache
	docker compose exec -T php php artisan cache:clear
	docker compose exec -T php php artisan config:clear
