import { Component, effect, HostListener, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, RouterLinkWithHref } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/auth/auth.service';
import { FamilyRepository } from './core/services/family.repository';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLinkWithHref, RouterLink,
    RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  isAuthenticated = signal(false);
  currentFamily;
  showMobileMenu = signal(false);
  isMobile = signal(window.innerWidth < 768);

  @HostListener('window:resize')
  onResize() {
    this.isMobile.set(window.innerWidth < 768);
  }

  constructor(
    private authService: AuthService,
    private familyRepository: FamilyRepository,
  ) {
    this.currentFamily = this.familyRepository.selectedFamily;

    effect(() => {
      const authenticated =
        this.authService.isAuthenticated();

      this.isAuthenticated.set(authenticated);

      if (authenticated) {
        this.familyRepository.loadFamilies();
      }
    });
  }
  toggleMenu() {
    this.showMobileMenu.set(!this.showMobileMenu());
  }

  closeMenu() {
    this.showMobileMenu.set(false);
  }

  async logout() {
    this.closeMenu();
    await this.authService.signOut();
  }
}