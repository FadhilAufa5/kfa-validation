<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Validation;

class ValidationCompletedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected Validation $validation;

    /**
     * Create a new notification instance.
     */
    public function __construct(Validation $validation)
    {
        $this->validation = $validation;
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
        $status = $this->validation->mismatched_records > 0 ? 'invalid' : 'valid';
        $statusText = $status === 'valid' ? 'Valid' : 'Invalid';
        
        return [
            'type' => 'validation_completed',
            'validation_id' => $this->validation->id,
            'file_name' => $this->validation->file_name,
            'document_type' => ucfirst($this->validation->document_type),
            'document_category' => $this->validation->document_category,
            'status' => $status,
            'status_text' => $statusText,
            'score' => $this->validation->score,
            'total_records' => $this->validation->total_records,
            'matched_records' => $this->validation->matched_records,
            'mismatched_records' => $this->validation->mismatched_records,
            'view_url' => route("{$this->validation->document_type}.show", ['id' => $this->validation->id]),
            'message' => "Validation for {$this->validation->file_name} has been completed with {$statusText} status (Score: {$this->validation->score}%)",
            'completed_at' => $this->validation->updated_at->toISOString(),
        ];
    }

    /**
     * Get the mail representation of the notification (optional).
     */
    public function toMail(object $notifiable): MailMessage
    {
        $status = $this->validation->mismatched_records > 0 ? 'Invalid' : 'Valid';
        
        return (new MailMessage)
            ->subject('Validation Completed - ' . $this->validation->file_name)
            ->line("Your validation for {$this->validation->file_name} has been completed.")
            ->line("Status: {$status}")
            ->line("Score: {$this->validation->score}%")
            ->line("Total Records: {$this->validation->total_records}")
            ->line("Matched: {$this->validation->matched_records}")
            ->line("Mismatched: {$this->validation->mismatched_records}")
            ->action('View Results', route("{$this->validation->document_type}.show", ['id' => $this->validation->id]))
            ->line('Thank you for using our validation system!');
    }
}
