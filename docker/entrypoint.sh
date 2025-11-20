#!/bin/bash

# Run migrations
php artisan migrate --force

# Start PHP-FPM
php-fpm
