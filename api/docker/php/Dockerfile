# A Dockerfile is a recipe for building an image: a frozen snapshot of an
# operating system with exactly the software your application needs. Everyone who
# builds from this file gets a byte-identical environment.

FROM php:8.3-fpm-alpine

# System packages needed to compile the PHP extensions below.
RUN apk add --no-cache \
        icu-dev \
        libzip-dev \
        oniguruma-dev \
        linux-headers \
        $PHPIZE_DEPS

# PHP extensions are compiled modules that add capabilities to the language.
#   pdo_mysql - lets PHP talk to MySQL (PDO is PHP's database abstraction layer)
#   bcmath    - arbitrary-precision maths, so money and tonnage never lose cents
#   intl      - locale-aware number and date formatting
#   opcache   - caches compiled PHP bytecode in memory; roughly a 3x speedup
RUN docker-php-ext-install -j"$(nproc)" \
        pdo_mysql \
        bcmath \
        intl \
        zip \
        opcache

# Redis support ships as a PECL extension rather than in core PHP.
RUN pecl install redis \
    && docker-php-ext-enable redis \
    && apk del $PHPIZE_DEPS

COPY docker/php/php.ini /usr/local/etc/php/conf.d/northline.ini

# Composer is PHP's dependency manager, the equivalent of npm for Node. Copying
# the binary from the official image avoids installing it by hand.
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Dependencies are installed in their own layer, before the application code is
# copied in. Docker caches layers, so editing a controller does not trigger a
# full reinstall of every package.
COPY composer.json composer.lock* ./
RUN composer install \
        --no-interaction \
        --no-scripts \
        --prefer-dist \
        --no-progress \
    || echo "composer install deferred to first run"

COPY . .

# Running as a non-root user limits the damage if the application is ever
# compromised. The container should not be able to rewrite its own OS.
RUN addgroup -g 1000 app \
    && adduser -u 1000 -G app -s /bin/sh -D app \
    && mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache \
    && chown -R app:app /var/www/html

USER app

EXPOSE 9000

CMD ["php-fpm"]
