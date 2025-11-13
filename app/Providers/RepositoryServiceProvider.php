<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Repositories\Contracts\ValidationRepositoryInterface;
use App\Repositories\ValidationRepository;
use App\Repositories\Contracts\MappedFileRepositoryInterface;
use App\Repositories\MappedFileRepository;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->bind(ValidationRepositoryInterface::class, ValidationRepository::class);
        $this->app->bind(MappedFileRepositoryInterface::class, MappedFileRepository::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
