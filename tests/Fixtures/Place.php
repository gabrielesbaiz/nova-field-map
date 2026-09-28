<?php

declare(strict_types=1);

namespace Gabrielesbaiz\NovaFieldMap\Tests\Fixtures;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property mixed $coordinates
 */
class Place extends Model
{
    protected $guarded = [];

    public $timestamps = false;

    public function stops(): HasMany
    {
        return $this->hasMany(Stop::class);
    }
}
