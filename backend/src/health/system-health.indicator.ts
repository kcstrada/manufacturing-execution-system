import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import * as os from 'os';
import * as fs from 'fs';

/**
 * System health indicator for OS-level checks
 */
@Injectable()
export class SystemHealthIndicator extends HealthIndicator {
  /**
   * Check CPU usage
   */
  async checkCPU(key: string): Promise<HealthIndicatorResult> {
    try {
      const cpus = os.cpus();
      const loadAverage = os.loadavg();
      
      // Calculate CPU usage percentage
      let totalIdle = 0;
      let totalTick = 0;
      
      cpus.forEach(cpu => {
        for (const type in cpu.times) {
          totalTick += cpu.times[type as keyof typeof cpu.times];
        }
        totalIdle += cpu.times.idle;
      });
      
      const idle = totalIdle / cpus.length;
      const total = totalTick / cpus.length;
      const usage = 100 - ~~(100 * idle / total);
      
      const isHealthy = usage < 80; // Consider unhealthy if CPU usage > 80%
      
      const result = this.getStatus(key, isHealthy, {
        cores: cpus.length,
        model: cpus[0]?.model,
        usage: `${usage}%`,
        loadAverage: {
          '1min': loadAverage[0]?.toFixed(2) || '0.00',
          '5min': loadAverage[1]?.toFixed(2) || '0.00',
          '15min': loadAverage[2]?.toFixed(2) || '0.00',
        },
      });

      if (isHealthy) {
        return result;
      }
      throw new HealthCheckError('CPU usage is too high', result);
    } catch (error) {
      throw new HealthCheckError(
        'CPU check failed',
        this.getStatus(key, false, {
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }

  /**
   * Check system uptime
   */
  async checkUptime(key: string): Promise<HealthIndicatorResult> {
    const uptime = os.uptime();
    const processUptime = process.uptime();
    
    // Consider healthy if system has been up for more than 5 minutes
    const isHealthy = uptime > 300;
    
    return this.getStatus(key, isHealthy, {
      system: {
        uptime: uptime,
        uptimeHuman: this.formatUptime(uptime * 1000),
      },
      process: {
        uptime: processUptime,
        uptimeHuman: this.formatUptime(processUptime * 1000),
      },
    });
  }

  /**
   * Check file descriptors (Linux/Unix only)
   */
  async checkFileDescriptors(key: string): Promise<HealthIndicatorResult> {
    if (process.platform === 'win32') {
      return this.getStatus(key, true, {
        message: 'File descriptor check not available on Windows',
      });
    }

    try {
      // Read file descriptor limits
      const softLimit = await this.getFileDescriptorLimit('soft');
      const hardLimit = await this.getFileDescriptorLimit('hard');
      const currentUsage = await this.getCurrentFileDescriptors();
      
      const usagePercent = (currentUsage / softLimit) * 100;
      const isHealthy = usagePercent < 80; // Consider unhealthy if > 80% of limit
      
      const result = this.getStatus(key, isHealthy, {
        current: currentUsage,
        softLimit,
        hardLimit,
        usagePercent: `${usagePercent.toFixed(2)}%`,
      });

      if (isHealthy) {
        return result;
      }
      throw new HealthCheckError('File descriptor usage is too high', result);
    } catch (error) {
      // If we can't check, assume healthy but log the issue
      return this.getStatus(key, true, {
        message: 'File descriptor check not available',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check load average
   */
  async checkLoadAverage(key: string): Promise<HealthIndicatorResult> {
    const loadAverage = os.loadavg();
    const cpuCount = os.cpus().length;
    
    // Consider unhealthy if 5-minute load average > number of CPUs
    const isHealthy = (loadAverage[1] || 0) < cpuCount;
    
    const result = this.getStatus(key, isHealthy, {
      loadAverage: {
        '1min': loadAverage[0]?.toFixed(2) || '0.00',
        '5min': loadAverage[1]?.toFixed(2) || '0.00',
        '15min': loadAverage[2]?.toFixed(2) || '0.00',
      },
      cpuCount,
      threshold: cpuCount,
    });

    if (isHealthy) {
      return result;
    }
    throw new HealthCheckError('System load is too high', result);
  }

  /**
   * Check network interfaces
   */
  async checkNetwork(key: string): Promise<HealthIndicatorResult> {
    const interfaces = os.networkInterfaces();
    const activeInterfaces: any[] = [];
    
    for (const [name, addrs] of Object.entries(interfaces)) {
      if (addrs) {
        for (const addr of addrs) {
          if (!addr.internal && addr.family === 'IPv4') {
            activeInterfaces.push({
              name,
              address: addr.address,
              netmask: addr.netmask,
              mac: addr.mac,
            });
          }
        }
      }
    }
    
    const isHealthy = activeInterfaces.length > 0;
    
    const result = this.getStatus(key, isHealthy, {
      interfaces: activeInterfaces,
      count: activeInterfaces.length,
    });

    if (isHealthy) {
      return result;
    }
    throw new HealthCheckError('No active network interfaces found', result);
  }

  /**
   * Get comprehensive system information
   */
  async getSystemInfo(key: string): Promise<HealthIndicatorResult> {
    return this.getStatus(key, true, {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      type: os.type(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpus: os.cpus().length,
      uptime: os.uptime(),
      homeDir: os.homedir(),
      tmpDir: os.tmpdir(),
    });
  }

  /**
   * Format uptime in human-readable format
   */
  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }

  /**
   * Get file descriptor limit (Linux/Unix)
   */
  private async getFileDescriptorLimit(type: 'soft' | 'hard'): Promise<number> {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      const flag = type === 'soft' ? '-Sn' : '-Hn';
      const { stdout } = await execAsync(`ulimit ${flag}`);
      return parseInt(stdout.trim(), 10);
    } catch {
      return -1;
    }
  }

  /**
   * Get current file descriptor usage (Linux/Unix)
   */
  private async getCurrentFileDescriptors(): Promise<number> {
    try {
      const pid = process.pid;
      const fdPath = `/proc/${pid}/fd`;
      
      return new Promise((resolve) => {
        fs.readdir(fdPath, (err, files) => {
          if (err) {
            resolve(0);
          } else {
            resolve(files.length);
          }
        });
      });
    } catch {
      return 0;
    }
  }
}