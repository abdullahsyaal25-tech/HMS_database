<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ArchiveOldRecords extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'archive:old-records {--dry-run : Show what would be archived without doing it} {--years=2 : Years to keep active}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Archive old appointment records to improve performance';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $years = (int) $this->option('years');
        $cutoffDate = now()->subYears($years);

        $this->info("Archiving records older than {$cutoffDate->format('Y-m-d')}");

        // Create archive tables if they don't exist
        $this->createArchiveTables();

        // Count records to archive
        $appointmentCount = Appointment::where('appointment_date', '<', $cutoffDate)->count();

        $this->info("Records to archive:");
        $this->line("- Appointments: {$appointmentCount}");

        if ($appointmentCount === 0) {
            $this->info('No records to archive.');
            return;
        }

        if ($this->option('dry-run')) {
            $this->warn('Dry run mode - no changes made.');
            return;
        }

        if (!$this->confirm('Proceed with archiving?')) {
            return;
        }

        $this->archiveAppointments($cutoffDate);

        $this->info('Archiving completed successfully.');
    }

    private function createArchiveTables()
    {
        if (!Schema::hasTable('archive_appointments')) {
            Schema::create('archive_appointments', function ($table) {
                $table->id();
                $table->string('appointment_id')->unique();
                $table->foreignId('patient_id');
                $table->foreignId('doctor_id');
                $table->foreignId('department_id');
                $table->dateTime('appointment_date');
                $table->enum('status', ['scheduled', 'completed', 'cancelled', 'no_show']);
                $table->text('reason')->nullable();
                $table->text('notes')->nullable();
                $table->decimal('fee', 8, 2);
                $table->timestamps();
            });
        }
    }

    private function archiveAppointments($cutoffDate)
    {
        $this->info('Archiving appointments...');

        DB::statement("
            INSERT INTO archive_appointments
            SELECT * FROM appointments
            WHERE appointment_date < ?
        ", [$cutoffDate]);

        $deleted = Appointment::where('appointment_date', '<', $cutoffDate)->delete();

        $this->info("Archived {$deleted} appointments.");
    }
}
