/**
 * @param {JQuery} menu
 * @param {number} time
 */
export const fadeInOutMenu = (menu, time) => {
    menu.hide().fadeIn();
    setTimeout(() => menu.fadeOut(), time);
    return menu;
}