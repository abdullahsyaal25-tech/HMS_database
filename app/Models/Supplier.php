<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\PurchaseOrder;

class Supplier extends Model
{
    protected $fillable = [
        'supplier_id',
        'name',
        'contact_person',
        'phone',
        'address',
        'notes',
        'status',
    ];

    public function purchaseOrders()
    {
        return $this->hasMany(PurchaseOrder::class);
    }
}
