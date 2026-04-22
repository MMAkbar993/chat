<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $datas = [
			1 => [
				'first_name' => 'Leo',
				'last_name' => 'Chelliah',
                'email' => 'admin@gmail.com',
                'user_name' => 'admin_user',
                'user_type' => 1,
                'password' => Hash::make('admin'),
				'mobile_number' => '8978675654',
                'created_by' => 1,
            ],
            2 => [
				'first_name' => 'Lenin',
				'last_name' => 'Kumar',
                'email' => 'user@gmail.com',
                'user_name' => 'front_user',
                'user_type' => 2,
                'password' => Hash::make('user'),
				'mobile_number' => '8978675655',
                'created_by' => 1,
            ],
            3 => [
                'first_name' => 'John',
                'last_name' => 'Doe',
                'email' => 'john@gmail.com',
                'user_name' => 'front_user_1',
                'user_type' => 2,
                'password' => Hash::make('user'),
                'mobile_number' => '8978675656',
                'created_by' => 1,
            ],
            4 => [
                'first_name' => 'Arun',
                'last_name' => 'Britto',
                'email' => 'arun@gmail.com',
                'user_name' => 'front_user_2',
                'user_type' => 2,
                'password' => Hash::make('user'),
                'mobile_number' => '8978675657',
                'created_by' => 1,
            ],
            5 => [
                'first_name' => 'Bala',
                'last_name' => 'Ganesh',
                'email' => 'bala@gmail.com',
                'user_name' => 'front_user_3',
                'user_type' => 2,
                'password' => Hash::make('user'),
                'mobile_number' => '8978675658',
                'created_by' => 1,
            ],
            6 => [
                'first_name' => 'Rajesh',
                'last_name' => 'Kumar',
                'email' => 'rajesh@gmail.com',
                'user_name' => 'front_user_4',
                'user_type' => 2,
                'password' => Hash::make('user'),
                'mobile_number' => '8978675611',
                'created_by' => 1,
            ],
		];
		foreach ($datas as $id => $data) {
			$row = User::firstOrNew([
				'id' => $id,
			]);
			$row->fill($data);
			$row->save();
        }
    }
}
