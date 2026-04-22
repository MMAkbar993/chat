<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\LanguageSettings;


class LanguageSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $datas = [
			1 => [
                'user_id' => '1',
				'language_name' => 'English',
				'code' => 'en',
				'active_status' => '1',
            ],
            2 => [
				'user_id' => '1',
				'language_name' => 'Arabic',
				'code' => 'ar',
				'active_status' => '1',
            ],
            3 => [
				'user_id' => '1',
				'language_name' => 'Chinese',
				'code' => 'zh',
				'active_status' => '1',
            ],
            4 => [
				'user_id' => '1',
				'language_name' => 'Hindi',
				'code' => 'hi',
				'active_status' => '1',
            ],
		];
		foreach ($datas as $id => $data) {
			$row = LanguageSettings::firstOrNew([
				'id' => $id,
			]);
			$row->fill($data);
			$row->save();
		}
    }
}
