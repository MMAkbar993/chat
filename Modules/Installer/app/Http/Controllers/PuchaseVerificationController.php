<?php

namespace Modules\Installer\app\Http\Controllers;

use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Modules\Installer\app\Enums\InstallerInfo;
use Modules\Installer\app\Models\Configuration;


class PuchaseVerificationController extends Controller
{
    public function __construct()
    {
        set_time_limit(8000000);
    }

    public function index()
    {
        return view('installer::index');
    }

    // public function validatePurchase(Request $request)
    // {

    //     session()->flush();

    //     $request->validate([
    //         'purchase_code' => 'required|string',
    //     ]);

    //     $purchaseCode = $request->purchase_code;

    //     try {
    //         // Perform local validation
    //         $response = InstallerInfo::localValidatePurchase($purchaseCode);

    //         // Mark step 1 as complete if validation is successful
    //         if ($response['success']) {
    //             session()->put('step-1-complete', true);
    //         }
    //         Configuration::updateStep(2);
    //         // Return the validation response
    //         return response()->json($response, 200);
    //     } catch (Exception $e) {
    //         // Log any unexpected errors
    //         Log::error('Error during local validation: ' . $e->getMessage());

    //         // Return a generic server error message
    //         return response()->json(['success' => false, 'message' => 'Server Error'], 200);
    //     }
    // }

    public function validatePurchase(Request $request)
    {
        session()->flush();
        $request->validate([
            'purchase_code' => 'required|string',
        ]);

        try {
            $response = Http::asForm()->post(InstallerInfo::VERIFICATION_URL->value, [
                'purchase_code' => $request->purchase_code,
            ]);
            $data = $response->json();
            if ($data['status'] == true) {

                session()->put('step-1-complete', true);

                // if (InstallerInfo::rewriteHashedFile($response, $request->purchase_code)) {
                    return response()->json(['success' => true, 'message' => "Purchase Code Verified Successfully"], 200);
                // }
                // dd($data['status']);

            }
            else {
                return response()->json([
                    'success' => false,
                    'message' => $data['message'] ?? 'Purchase Code is Invalid'
                ], 200);
            }

            return response()->json(['success' => false, 'message' => (is_array($response) && array_key_exists('message', $response)) && $response['message'] ? $response['message'] : 'Verification Failed'], 200);
        } catch (Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['success' => false, 'message' => 'Server Error'], 200);
        }
    }
}
