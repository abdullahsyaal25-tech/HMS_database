<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Medicine;

class MedicineCategory extends Model
{
    protected $fillable = [
        'name',
        'description',
    ];

    public function medicines()
    {
        return $this->hasMany(Medicine::class);
    }
}
