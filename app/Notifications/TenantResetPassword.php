<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;

class TenantResetPassword extends ResetPassword
{

    protected function resetUrl($notifiable): string
    {
        $domain = tenant()?->domains->first()->domain;

        if (!$domain) {
            return parent::resetUrl($notifiable);
        }

        // Get the scheme from the app URL
        $scheme = parse_url(config('app.url'), PHP_URL_SCHEME) ?: 'https';

        // Build the reset URL with the domain and token
        return $scheme . '://' . $domain . '/tenant/reset-password/' . $this->token . '?email=' . urlencode($notifiable->getEmailForPasswordReset());
    }
}
