<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user
        User::create([
            'name' => 'Admin',
            'email' => 'admin1@gmail.com',
            'password' => Hash::make('admin123$$$'),
            'is_admin' => true,
            'email_verified_at' => now(), // Admin auto verified
        ]);

        $this->command->info('Admin user created successfully!');
        $this->command->info('Email: admin1@gmail.com');
        $this->command->info('Password: admin123$$$');
    }
}
