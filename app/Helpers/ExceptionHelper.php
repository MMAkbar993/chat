<?php

use Illuminate\Http\JsonResponse;

/*
* Return response functions
*/
function send_bad_request_response(string $error_message): JsonResponse
{
    $response_array = [
        "code" => -1,
        "message" => $error_message,
        "data" => [
            'error' => [
                'user_message' => 'Required parameters need to be filled and it must be valid.',
                'internal_message' => $error_message,
                'code' => '1002'
            ]
        ]
    ];

    return response()->json(convertNullsAsEmpty($response_array), 200);
}

/**
 * Converts all `null` values in an array to empty strings.
 * 
 * @param array<string, mixed> $response_array Input array with string keys and mixed values.
 * @return array<string, mixed> The modified array.
 */
function convertNullsAsEmpty(array $response_array): array
{
    array_walk_recursive($response_array, function (&$value, $key) {
        $value = is_int($value) ? (string)$value : $value;
        $value = $value === null ? "" : $value;
    });

    return $response_array;
}

/**
 * Sends a success response.
 * 
 * @param array<string, mixed> $data Response data with string keys and mixed values.
 * @param string $message Success message.
 * @return JsonResponse The JSON response.
 */
function send_success_response(array $data, string $message = 'Success'): JsonResponse
{
    $response_array = [
        "code" => "200",
        "message" => $message,
        "data" => $data
    ];

    return response()->json(convertNullsAsEmpty($response_array), 200);
}

function send_failure_response(string $error_message, string $internal_message): JsonResponse
{
    $response_array = [
        "code" => -1,
        "message" => $error_message,
        "data" => [
            'error' => [
                'user_message' => $error_message,
                'internal_message' => $internal_message,
                'code' => '1002'
            ]
        ]
    ];

    return response()->json(convertNullsAsEmpty($response_array), 200);
}

function send_unauthorised_request_response(string $error_message): JsonResponse
{
    $response_array = [
        "code" => 401,
        "message" => 'Unauthorized request',
        "data" => [
            'error' => [
                'user_message' => 'Unauthorized request',
                'internal_message' => $error_message,
                'code' => '1001'
            ]
        ]
    ];

    return response()->json(convertNullsAsEmpty($response_array), 401);
}

function send_exception_response(string $error_message): JsonResponse
{
    $response_array = [
        "code" => 500,
        "message" => 'Something went wrong! Please try again later.',
        "data" => [
            'error' => [
                'user_message' => 'Something went wrong. Kindly report on this.',
                'internal_message' => $error_message,
                'code' => '1003'
            ]
        ]
    ];

    return response()->json(convertNullsAsEmpty($response_array), 500);
}
