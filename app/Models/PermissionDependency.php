<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PermissionDependency extends Model
{
    protected $fillable = [
        'permission_id',
        'depends_on_permission_id',
    ];

    public function permission()
    {
        return $this->belongsTo(Permission::class, 'permission_id');
    }

    public function dependsOnPermission()
    {
        return $this->belongsTo(Permission::class, 'depends_on_permission_id');
    }
}
