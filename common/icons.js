/*
 * Traced from the editor's exclamation_triangle_red-icon.svg. The original
 * carries a <style> block with generic class names; those are inlined here so
 * nothing collides once the markup is injected into the host page.
 */
export const warningTriangleIcon = /* html */ `
<svg viewBox="0 0 28 25" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.3,2l-11,19C1.1,21.3,1,21.6,1,22s0.1,0.7,0.3,1s0.4,0.6,0.7,0.7C2.3,23.9,2.6,24,3,24h22
	c0.4,0,0.7-0.1,1-0.3c0.3-0.2,0.6-0.4,0.7-0.7c0.2-0.3,0.3-0.6,0.3-1s-0.1-0.7-0.3-1l-11-19c-0.2-0.3-0.4-0.6-0.7-0.7
	S14.4,1,14,1s-0.7,0.1-1,0.3C12.7,1.4,12.4,1.7,12.3,2z" fill="#eb5757" fill-opacity="0.1" stroke="#eb5757" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M14,10v5" stroke="#eb5757" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M14,21c0.8,0,1.5-0.7,1.5-1.5S14.8,18,14,18s-1.5,0.7-1.5,1.5S13.2,21,14,21z" fill="#eb5757"/>
</svg>`

export const infoIcon = /* html */ `
<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9 13H11V15H9V13ZM9 5H11V11H9V5ZM9.99 0C4.47 0 0 4.48 0 10C0 15.52 4.47 20 9.99 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 9.99 0ZM10 18C5.58 18 2 14.42 2 10C2 5.58 5.58 2 10 2C14.42 2 18 5.58 18 10C18 14.42 14.42 18 10 18Z" fill="currentColor"/>
</svg>`


export const successIcon = /* html */ `
<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM10 18C5.59 18 2 14.41 2 10C2 5.59 5.59 2 10 2C14.41 2 18 5.59 18 10C18 14.41 14.41 18 10 18ZM14.59 5.58L8 12.17L5.41 9.59L4 11L8 15L16 7L14.59 5.58Z" fill="currentColor"/>
</svg>`


export const warningIcon = /* html */ `
<svg width="22" height="19" viewBox="0 0 22 19" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11 3.99L18.53 17H3.47L11 3.99ZM11 0L0 19H22L11 0ZM12 14H10V16H12V14ZM12 8H10V12H12V8Z" fill="currentColor"/>
</svg>`


export const spinnerIcon = /* html */ `
<svg class="plugin-ai-integration-spinner" width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 10.6667C0 4.77867 4.77867 0 10.6667 0V2.13333C5.96267 2.13333 2.13333 5.96267 2.13333 10.6667C2.13333 15.3707 5.96267 19.2 10.6667 19.2C15.3707 19.2 19.2 15.3707 19.2 10.6667H21.3333C21.3333 16.5547 16.5547 21.3333 10.6667 21.3333C4.77867 21.3333 0 16.5547 0 10.6667Z" fill="currentColor"/>
</svg>`

/* Trailing chevron on the docs link - currentColor so it stays with the link. */
export const chevronRightIcon = /* html */ `
<svg width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 10.5175L1.0325 11.55L6.8075 5.775L1.0325 0L0 1.0325L4.7425 5.775L0 10.5175Z" fill="currentColor"/>
</svg>`

/*
 * Used per log row. Distinct from infoIcon, which the banner and the
 * auto-generate hint share - `fill` is currentColor so the row's own colour
 * (slate-400, and whatever dark mode sets) carries through.
 */
export const logInfoIcon = /* html */ `
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.94899 0C6.37844 0 4.80789 0.490798 3.53181 1.37423C2.25574 2.25767 1.17598 3.43558 0.587028 4.90798C-0.0019294 6.38037 -0.198248 7.95092 0.0962301 9.52147C0.390709 11.092 1.17598 12.4663 2.25574 13.6442C3.33549 14.8221 4.80789 15.5092 6.37844 15.8037C7.94899 16.0982 9.51954 16 10.9919 15.3129C12.4643 14.7239 13.7404 13.6442 14.5257 12.3681C15.4091 11.092 15.8999 9.52147 15.8999 7.95092C15.8999 5.79141 15.0165 3.82822 13.5441 2.35583C12.0717 0.883436 10.1085 0 7.94899 0ZM7.85083 3.73006C8.04715 3.73006 8.24347 3.82822 8.34163 3.92638C8.43979 3.92638 8.63611 4.1227 8.63611 4.22086C8.73427 4.41718 8.73427 4.6135 8.73427 4.71166C8.73427 4.90798 8.63611 5.00613 8.43979 5.20245C8.34163 5.39877 8.14531 5.49693 8.04715 5.49693C7.85083 5.49693 7.65451 5.49693 7.55635 5.39877C7.26187 5.39877 7.16372 5.30061 7.06556 5.10429C6.9674 4.90798 6.86924 4.80982 6.86924 4.6135C6.86924 4.31902 6.9674 4.1227 7.16372 3.92638C7.36003 3.73006 7.55635 3.73006 7.85083 3.73006ZM8.63611 12.2699H7.94899C7.75267 12.2699 7.65451 12.1718 7.55635 12.0736C7.45819 11.9755 7.36003 11.7791 7.36003 11.681V7.95092C7.16372 7.95092 7.06556 7.85276 6.9674 7.7546C6.77108 7.65644 6.77108 7.55828 6.77108 7.36196C6.77108 7.16564 6.86924 7.06748 6.9674 6.96933C7.06556 6.87117 7.26187 6.77301 7.36003 6.77301H7.94899C8.14531 6.77301 8.24347 6.87117 8.34163 6.96933C8.43979 7.06748 8.53795 7.2638 8.53795 7.36196V11.092C8.73427 11.092 8.83243 11.1902 8.93059 11.2883C9.02875 11.3865 9.12691 11.5828 9.12691 11.681C9.12691 11.7791 9.02875 11.9755 8.93059 12.0736C8.93059 12.1718 8.73427 12.2699 8.63611 12.2699Z" fill="currentColor"/>
</svg>`

export const logsEmptyIcon = /* html */ `
<svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16 10V12H2V10H16ZM18 0H0V2H18V0ZM18 4H0V6H18V4ZM18 8H0V14H18V8Z" fill="currentColor"/>
</svg>
`

