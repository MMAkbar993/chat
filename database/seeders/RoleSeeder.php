<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $datas = [
			1 => [
                'name' => 'admin',
                'guard_name' => 'web',
                'permissions' => [
					1,2,3,4
				],
            ],
            2 => [
                'name' => 'user',
                'guard_name' => 'web',
                'permissions' => [
					1,2,3,4
				],
            ],
            3 => [
                'name' => 'provider',
                'guard_name' => 'web',
                'permissions' => [
					1,2,3,4
				],
            ]
		];

		foreach ($datas as $id => $data) {
            $permissions = $data['permissions'];
			unset($data['permissions']);
			$row = Role::firstOrNew([
				'id' => $id,
			]);
			$row->fill($data);
            $row->save();
            $row->permissions()->sync($permissions);
		}

        //assign role
        User::whereEmail('admin@gmail.com')->first()->assignRole('admin');
        User::whereEmail('user@gmail.com')->first()->assignRole('user');
    }
}
