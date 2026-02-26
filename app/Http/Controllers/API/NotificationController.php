<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\FirebaseService; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Kreait\Firebase\Exception\MessagingException;
use Throwable; // Use Throwable to catch all possible errors/exceptions

class NotificationController extends Controller
{
    /**
     * @var FirebaseService
     */
    protected $firebaseService;

    /**
     * NotificationController constructor.
     *
     * @param FirebaseService $firebaseService
     */
    public function __construct(FirebaseService $firebaseService)
    {
        // Use Laravel's service container to automatically inject our service
        $this->firebaseService = $firebaseService;
    }

    /**
     * Sends a simple push notification to a specific device.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function send(Request $request)
    {
        // 1. Validate the incoming request data
        $validator = Validator::make($request->all(), [
            'device_token' => 'required|string',
            'title'        => 'required|string|max:255',
            'body'         => 'required|string|max:1024',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            // 2. Use the service to send the notification
            $result = $this->firebaseService->sendNotification(
                $request->input('device_token'),
                $request->input('title'),
                $request->input('body')
                // No custom data payload for this simple notification
            );
            
            Log::info('Simple notification sent successfully.', ['result' => $result]);

            return response()->json([
                'success' => true,
                'message' => 'Notification sent successfully',
                'firebase_result' => $result
            ]);

        } catch (MessagingException $e) {
            Log::error('Firebase Messaging error during simple send: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Failed to send notification. The device token might be invalid.',
                'error' => $e->getMessage()
            ], 400);
        } catch (Throwable $e) {
            Log::error('An unexpected error occurred during simple send: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'An unexpected server error occurred.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validates input and sends a call notification with a data payload via Firebase.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sendCallNotification(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title'        => 'required|string|max:255',
            'body'         => 'required|string|max:1024',
            'channelName'  => 'sometimes|required|string',
            'fromId'       => 'sometimes|required',
            'toId'         => 'sometimes|required',
            'userIds'      => 'sometimes|required',
            'sound'        => 'nullable|string',
            'image'        => 'nullable|url',
            'ostype'       => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        
        $callDataPayload = [
            'channel' => $request->input('channelName', 'defaultChannel'),
            'fromid'  => $request->input('fromId'),
            'toid'    => $request->input('toId'),
            'userIds' => $request->input('toId'),
            'title'        => $request->input('title'),
            'body'         => $request->input('body'),
            'ostype'       => "web",
        ];

      
        $customData = [
            'data'         => json_encode($callDataPayload),
            'sound'        => $request->input('sound', 'default'),
            'title'        => $request->input('title'),
            'body'         => $request->input('body'),
            'device_token' => $request->input('device_token'),
            'ostype'       => "web",
        ];

        try {
           
            Log::info('Sending call notification with payload: ', $customData);

           
            $result = $this->firebaseService->sendNotification(
                $request->input('device_token'),
                $request->input('title'),
                $request->input('body'),
                $customData, 
                $request->input('image') 
            );

            
            return response()->json([
                'success' => true,
                'message' => 'Notification sent successfully!',
                'data'    => $customData,
                'firebase_result' => $result
            ]);

        } catch (MessagingException $e) {
            Log::error('Firebase Messaging error during call send: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Failed to send notification. The device token might be invalid.',
                'error' => $e->getMessage()
            ], 400);

        } catch (Throwable $e) {
            Log::error('An unexpected error occurred during call send: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'An unexpected server error occurred.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
