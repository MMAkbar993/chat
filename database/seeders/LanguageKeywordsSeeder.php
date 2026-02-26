<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\LanguageKeywords;

class LanguageKeywordsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $datas = [
			1 => [
                'language_id' => '1',
				'page' => 'home',
				'label' => 'heading',
				'value' => 'Heading',
            ],
            2 => [
				'language_id' => '2',
				'page' => 'about',
				'label' => 'heading',
				'value' => 'Heading',
            ],
            3 => [
				'language_id' => '3',
				'page' => 'contact',
				'label' => 'heading',
				'value' => 'Heading',
            ],
            4 => [
				'language_id' => '4',
				'page' => 'blog',
				'label' => 'heading',
				'value' => 'Heading',
            ],
		];
		foreach ($datas as $id => $data) {
			$row = LanguageKeywords::firstOrNew([
				'id' => $id,
			]);
			$row->fill($data);
			$row->save();
		}
    }
}
