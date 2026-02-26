<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;


class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $datas = [
			1 => [
				'name' => 'admin-clients',
				'guard_name' => 'web',
            ],
            2 => [
				'name' => 'admin-chats',
				'guard_name' => 'web',
            ],
            3 => [
				'name' => 'admin-reports',
				'guard_name' => 'web',
            ],
            4 => [
				'name' => 'admin-settings',
				'guard_name' => 'web',
            ],
		];
		foreach ($datas as $id => $data) {
			$row = Permission::firstOrNew([
				'id' => $id,
			]);
			$row->fill($data);
			$row->save();
		}
    }
}
