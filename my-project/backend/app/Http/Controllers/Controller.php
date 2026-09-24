<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;

/** Shared base controller (Laravel 11 pattern). */
class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;
}
