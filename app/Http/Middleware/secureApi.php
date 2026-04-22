<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class secureApi
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if(!in_array($request->headers->get('accept'), ['application/json', 'Application/Json'])){
            return response()->json([
                'Response' => [
                'response_code' => '-1',
                'response_message' => 'Accept header not available'
                ],
                'data' => (object)[]
            ]);
        }

        if (!in_array(strtolower($request->method()), ['put', 'post'])) {
            return $next($request);
        }
        $input = $request->all();

        function walk($input)
        {
            array_walk($input, function (&$input) {

                if (!is_array($input)) {
                    if (is_string($input)) {
                        $input = strip_tags($input);
                    }

                } else {
                    walk($input);
                }
            });

            return $input;
        }

        $input = walk($input);

        $request->merge($input);

        return $next($request);
    }
}
