<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Faker\Factory;
use Faker\Generator;

class FakerServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Override the default Faker factory to exclude the problematic Text provider
        $this->app->singleton(Generator::class, function () {
            return $this->createCustomFaker();
        });
        
        // Also bind as 'faker' for Laravel
        $this->app->singleton('faker', function () {
            return $this->createCustomFaker();
        });
    }
    
    /**
     * Create a custom Faker instance without the Text provider
     */
    protected function createCustomFaker(): Generator
    {
        $generator = new Generator();
        
        // Standard providers that work (excluding Text and UserAgent which may have issues)
        $providers = [
            'Address',
            'Barcode', 
            'Biased',
            'Color',
            'Company',
            'DateTime',
            'File',
            'HtmlLorem',
            'Image',
            'Internet',
            'Lorem',
            'Medical',
            'Miscellaneous',
            'Payment',
            'Person',
            'PhoneNumber',
            'Uuid',
        ];
        
        foreach ($providers as $provider) {
            $providerClassName = '\\Faker\\Provider\\' . $provider;
            if (class_exists($providerClassName)) {
                try {
                    $reflection = new \ReflectionClass($providerClassName);
                    if (!$reflection->isAbstract()) {
                        $generator->addProvider(new $providerClassName($generator));
                    }
                } catch (\Exception $e) {
                    // Skip providers that can't be instantiated
                }
            }
        }
        
        return $generator;
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
