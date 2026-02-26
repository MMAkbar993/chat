<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;


class SessionController extends Controller
{

    public function __construct()
    {
    }

    public function fireSession(Request $request)
    {
        if ($request->has('user') && !empty($request->input('user'))) {
                $data = [
                    'user' => $request->input('user'),
                    'username' => $request->input('userName'),
                    'name' => $request->input('firstName'),
                    'state' => $request->input('state'),
                    'language' => $request->input('language')
                ];
                Session::put('username', $data);
           
        } else {
            $data = ['user' => '', 'state' => 'yes'];
            Session::forget('username');
            return response()->json($data);
        }
    }


}
