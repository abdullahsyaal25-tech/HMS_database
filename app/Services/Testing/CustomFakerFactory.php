<?php

namespace App\Services\Testing;

use Faker\Factory;
use Faker\Generator;

/**
 * Custom Faker Factory that excludes the problematic Text provider
 * This is a workaround for the Faker v1.24.1 bug where Text is abstract
 */
class CustomFakerFactory
{
    /**
     * Create a Faker generator without the Text provider
     */
    public static function create(string $locale = Factory::DEFAULT_LOCALE): Generator
    {
        $generator = new Generator();
        
        // Standard providers that work
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
            if (class_exists($providerClassName) && !method_exists($providerClassName, 'abstract')) {
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
        
        // Add locale-specific providers
        if ($locale !== Factory::DEFAULT_LOCALE) {
            foreach ($providers as $provider) {
                $providerClassName = '\\Faker\\Provider\\' . $locale . '\\' . $provider;
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
        }
        
        return $generator;
    }
}
