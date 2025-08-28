# Run all tests (Node/Prisma and plugin)
test:
	pnpm test || true
	$(MAKE) test-plugin

# Run only Minecraft plugin tests
test-plugin:
	cd plugin && mvn test
# Show help for all Makefile commands
help:
	@echo "\nAvailable make commands:"
	@echo "  help                Show this help message"
	@echo "  clean-empty-files   Remove all empty files except .gitkeep and .gitignore"
	@echo "  install             Install Node.js dependencies (pnpm)"
	@echo "  prisma-generate     Generate Prisma client"
	@echo "  prisma-push         Push Prisma schema to database"
	@echo "  prisma-migrate      Run Prisma migrations"
	@echo "  prisma-studio       Open Prisma Studio"
	@echo "  prisma-reset        Reset the Prisma database"
	@echo "  register-commands   Register Discord bot commands"
	@echo "  list-commands       List Discord bot commands"
	@echo "  delete-commands     Delete all Discord bot commands"
	@echo "  dev                 Run Vercel dev server"
	@echo "  deploy              Deploy to Vercel"
	@echo "  plugin-build        Build the Minecraft plugin (Maven)"
	@echo "  plugin-clean        Clean the Minecraft plugin build (Maven)"
	@echo "  plugin-clean-compile Clean and compile the Minecraft plugin (Maven)"
	@echo "  plugin-jar          Copy built plugin jar to project root"
	@echo "  all                 Run install, prisma-generate, and plugin-build"
# Makefile for project management

# Remove all empty files except .gitkeep and .gitignore
clean-empty-files:
	find . -type f -empty ! -name '.gitkeep' ! -name '.gitignore' -delete

# Node/Vercel/Prisma
install:
	pnpm install

prisma-generate:
	pnpm run db:generate

prisma-push:
	pnpm run db:push

prisma-migrate:
	pnpm run db:migrate

prisma-studio:
	pnpm run db:studio

prisma-reset:
	pnpm run db:reset

register-commands:
	pnpm run register-commands

list-commands:
	pnpm run list-commands

delete-commands:
	pnpm run delete-commands

dev:
	pnpm run dev

deploy:
	pnpm run deploy

# Minecraft Plugin (Maven)

plugin-build:
	cd plugin && mvn package

plugin-clean:
	cd plugin && mvn clean

plugin-clean-compile:
	cd plugin && mvn clean compile

plugin-jar:
	cp plugin/target/DiscordAuth-1.0.0.jar ./DiscordAuth-1.0.0.jar

# All
all: install prisma-generate plugin-build

.PHONY: clean-empty-files install prisma-generate prisma-push prisma-migrate prisma-studio prisma-reset register-commands list-commands delete-commands dev deploy plugin-build plugin-clean plugin-jar plugin-clean-compile all
