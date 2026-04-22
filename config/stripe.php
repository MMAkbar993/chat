<?php

return [
    'key' => env('STRIPE_KEY'),
    'secret' => env('STRIPE_SECRET'),
    'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),

    'plans' => [
        'monthly' => [
            'price_id' => env('STRIPE_PRICE_ID_MONTHLY'),
            'amount' => '6.99',
            'label' => 'Monthly',
            'interval' => 'month',
        ],
        'yearly' => [
            'price_id' => env('STRIPE_PRICE_ID_YEARLY'),
            'amount' => '70.00',
            'label' => 'Yearly',
            'interval' => 'year',
            'badge' => '2 months free',
        ],
    ],
];
