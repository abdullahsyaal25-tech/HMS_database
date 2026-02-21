<?php

namespace App\Events;

use App\Models\Wallet;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WalletUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $wallet;
    public $revenueData;
    public $transactions;

    /**
     * Create a new event instance.
     */
    public function __construct(Wallet $wallet, array $revenueData, $transactions)
    {
        $this->wallet = $wallet;
        $this->revenueData = $revenueData;
        $this->transactions = $transactions;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('wallet-updates'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'wallet.updated';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'wallet' => $this->wallet,
            'revenueData' => $this->revenueData,
            'transactions' => $this->transactions,
        ];
    }
}
