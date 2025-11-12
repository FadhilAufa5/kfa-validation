<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ValidationDataEmptyNotification extends Notification
{
    use Queueable;

    public function __construct(
        public array $emptyTables = []
    ) {
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Validation Data Empty',
            'message' => 'Some validation data tables are empty. Please upload the required data files.',
            'empty_tables' => $this->emptyTables,
            'action_url' => route('validation-setting.index'),
            'action_text' => 'Go to Validation Settings',
            'type' => 'warning',
            'icon' => 'alert-triangle',
        ];
    }
}
