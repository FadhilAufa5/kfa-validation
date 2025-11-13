<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\Validation\ValidationPipeline;
use App\Services\Validation\Steps\LoadConfigStep;
use App\Services\Validation\Steps\LoadValidationDataStep;
use App\Services\Validation\Steps\BuildValidationMapStep;
use App\Services\Validation\Steps\LoadUploadedDataStep;
use App\Services\Validation\Steps\BuildUploadedMapStep;
use App\Services\Validation\Steps\CompareDataStep;
use App\Services\Validation\Steps\CategorizeRowsStep;
use App\Services\Validation\Steps\SaveResultsStep;

/**
 * Validation Service Provider
 * 
 * Registers all validation pipeline components
 */
class ValidationServiceProvider extends ServiceProvider
{
    /**
     * Register services
     */
    public function register(): void
    {
        // Register pipeline as singleton
        $this->app->singleton(ValidationPipeline::class, function ($app) {
            return new ValidationPipeline();
        });

        // Register all steps (will be auto-resolved with dependencies)
        $this->app->bind(LoadConfigStep::class);
        $this->app->bind(LoadValidationDataStep::class);
        $this->app->bind(BuildValidationMapStep::class);
        $this->app->bind(LoadUploadedDataStep::class);
        $this->app->bind(BuildUploadedMapStep::class);
        $this->app->bind(CompareDataStep::class);
        $this->app->bind(CategorizeRowsStep::class);
        $this->app->bind(SaveResultsStep::class);
    }

    /**
     * Bootstrap services
     */
    public function boot(): void
    {
        //
    }
}
