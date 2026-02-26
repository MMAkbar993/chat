<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\SoftDeletes;

class WebsiteSettings extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'id', 'user_id', 'company_name', 'company_email', 'company_phone_number', 'company_fax', 'company_website', 'company_address', 'company_city', 'company_state', 'company_country', 'company_postal_code', 'created_at', ' updated_at', 'deleted_at'
    ];

    protected $hidden = ['created_at', 'updated_at', 'deleted_at', 'company_logo', 'company_icon', 'company_favicon', 'company_dark_logo'];

    protected $appends = ['company_logo_link', 'company_icon_link', 'company_favicon_link', 'company_dark_logo_link'];

    public function getCompanyLogoLinkAttribute() {
        $logo_original_path = config('image_settings.backEnd.admin.website_settings.logo.path');
        if (!empty($this->company_logo) && Storage::exists($logo_original_path . $this->company_logo)) {
            $custurl = request()->getSchemeAndHttpHost();
            return $custurl . Storage::url($logo_original_path. $this->company_logo);
        } else {
            return '';
        }
    }

    public function getCompanyIconLinkAttribute() {
        $icon_original_path = config('image_settings.backEnd.admin.website_settings.icon.path');
        if (!empty($this->company_icon) && Storage::exists($icon_original_path . $this->company_icon)) {
            $custurl = request()->getSchemeAndHttpHost();
            return $custurl . Storage::url($icon_original_path. $this->company_icon);
        } else {
            return '';
        }
    }

    public function getCompanyFaviconLinkAttribute() {
        $favicon_original_path = config('image_settings.backEnd.admin.website_settings.favicon.path');
        if (!empty($this->company_favicon) && Storage::exists($favicon_original_path . $this->company_favicon)) {
            $custurl = request()->getSchemeAndHttpHost();
            return $custurl . Storage::url($favicon_original_path. $this->company_favicon);
        } else {
            return '';
        }
    }

    public function getCompanyDarklogoLinkAttribute() {
        $dark_logo_original_path = config('image_settings.backEnd.admin.website_settings.dark_logo.path');
        if (!empty($this->company_dark_logo) && Storage::exists($dark_logo_original_path . $this->company_dark_logo)) {
            $custurl = request()->getSchemeAndHttpHost();
            return $custurl . Storage::url($dark_logo_original_path. $this->company_dark_logo);
        } else {
            return '1';
        }
    }

}
