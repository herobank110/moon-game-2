import $ from 'jquery';
import { fadeInOutMenu } from '../utils/menu';

/** @param {{name: string}} data */
export const makeMenuRoot = (data) =>
    $('<div>').addClass('moon-menu moon-menu--opaque menu--' + data.name).append(
        $('<h4>').addClass('moon-menu__title').text('Moon Game'));

/** @param {{name: string, title: string, onClose?: () => void}} data */
const makeDialogRoot = (data) =>
    $('<div>').addClass('moon-dialog dialog--' + data.name).append(
        data.onClose
            ? $('<span>').addClass('moon-dialog__close').on('click', data.onClose)
            : $(),
        $('<h4>').addClass('moon-dialog__title').text(data.title));

export const makeWaitingForPlayerMenu = () =>
    makeMenuRoot({ name: 'waiting-for-player' }).append(
        $('<span>').text('Waiting for second player to join'));

export const makeLiftOffMenu = () => {
    const menu = makeMenuRoot({ name: 'lift-off' }).append(
        $('<span>').text('Get ready for lift off in'),
        $('<span>').addClass('lift-off-timer').text('10'),
        $('<span>').addClass('lift-off-diag lift-off-diag-1').text('😉 Hurry, it\'s about to leave!'),
        $('<span>').addClass('lift-off-diag lift-off-diag-2').text('😨 Are you sure this is safe?'),
        $('<span>').addClass('lift-off-diag lift-off-diag-3').text('😃 Of course!'),
        $('<div>').addClass('hero-star'));

    const liftOffTimerId = setInterval(() => {
        const el = menu.find('.lift-off-timer');
        const n = Number(el.text()) - 1;
        el.text(n);
        if (n == 0) { clearInterval(liftOffTimerId); }
    }, 1000);

    menu.find('.lift-off-diag').hide();
    setTimeout(() => menu.find('.lift-off-diag-1').fadeIn(), 1000);
    setTimeout(() => menu.find('.lift-off-diag-2').fadeIn(), 2800);
    setTimeout(() => menu.find('.lift-off-diag-1').fadeOut(), 3000);
    setTimeout(() => menu.find('.lift-off-diag-3').fadeIn(), 5600);
    setTimeout(() => menu.find('.lift-off-diag-2').fadeOut(), 5800);
    setTimeout(() => menu.find('.lift-off-diag-3').fadeOut(), 8600);

    setTimeout(() => menu.fadeOut(5000), 40000);

    return menu;
};

export const makeTooManyPlayersMenu = () =>
    makeMenuRoot({ name: 'too-many-players' }).append(
        $('<span>').text('All game sessions are currently in progress'),
        $('<span>').text('Please try again later'));

export const makeMatchHaltMenu = () =>
    makeMenuRoot({ name: 'match-halt' }).append(
        $('<span>').text('Sorry, the match was halted'),
        $('<span>').text('Regretfully your progress was not saved'),
        $('<span>').text('Please try again later'));

const makeTutorial1Dialog = () =>
    makeDialogRoot({ name: 'tutorial-1', title: 'Tutorial (1 / 2)' }).append(
        $('<span>').html('Your spaceship was destroyed'),
        $('<span>').html('Seek shelter in the caves and protect yourselves from the aliens'));

const makeTutorial2Dialog = () =>
    makeDialogRoot({ name: 'tutorial-2', title: 'Tutorial (2 / 2)' }).append(
        $('<span>').html('Press <kbd>WASD</kbd> to move'),
        $('<span>').html('Press <kbd>SPACE</kbd> to attack'));

export const makeTutorialDialog = () => {
    $("#menu-root").append(makeDialogRoot({ name: "", title: "hi", onClose: () => void console.log('hi') }));
    return $();
    // const t1 = fadeInOutMenu(makeTutorial1Dialog(), 6000);
    // setTimeout(() => {
    //     const t2 = t1.replaceWith(fadeInOutMenu(makeTutorial2Dialog(), 5000));
    // }, 6500);
    // return t1;
}