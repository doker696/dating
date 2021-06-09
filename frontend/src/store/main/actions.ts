import {api} from '@/api';
import router from '@/router';
import {getLocalToken, removeLocalToken, saveLocalToken} from '@/utils';
import {AxiosError} from 'axios';
import {getStoreAccessors} from 'typesafe-vuex';
import {ActionContext} from 'vuex';
import {State} from '../state';
import {
    commitAddNotification,
    commitRemoveNotification,
    commitSetLoggedIn,
    commitSetLogInError,
    commitSetToken,
    commitSetUser,
    commitSetUserProfile,
    commitSendSympathy,
    commitGetSympathy,commitSetUserId,
    commitSetUserProfileNotShown,
    commitSetUserProfileAvatar,
} from './mutations';
import {AppNotification, MainState} from './state';
import {ISendSympathy, IUserCreate, IUserProfile} from '@/interfaces';

type MainContext = ActionContext<MainState, State>;

export const actions = {
    async actionLogIn(context: MainContext, payload: { username: string; password: string }) {
        try {
            const response = await api.logInGetToken(payload.username, payload.password);
            const token = response.data.access_token;
            if (token) {
                saveLocalToken(token);
                commitSetToken(context, token);
                commitSetLoggedIn(context, true);
                commitSetLogInError(context, false);
                await dispatchGetUser(context);
                await dispatchGetUserProfile(context);
                await dispatchRouteLoggedIn(context);
                commitAddNotification(context, {content: 'Logged in', color: 'success'});
            } else {
                await dispatchLogOut(context);
            }
        } catch (err) {
            commitSetLogInError(context, true);
            await dispatchLogOut(context);
        }
    },
    async actionGetUser(context: MainContext) {
        try {
            const response = await api.getMe(context.state.token);
            if (response.data) {
                commitSetUser(context, response.data);
            }
        } catch (error) {
            await dispatchCheckApiError(context, error);
        }
    },
    async actionGetUserProfile(context: MainContext) {
        try {
            const response = await api.getMyProfile(context.state.token);
            
            if (response.data) {
                commitSetUserProfile(context, response.data);
            }
        } catch (error) {
            await dispatchCheckApiError(context, error);
        }
    },
    async actionGetUserId(context: MainContext, payload: number) {
        try {
            const response = await api.getUser(context.state.token,payload);
            
            if (response.data) {
                commitSetUserId(context, response.data);
            }
        } catch (error) {
            await dispatchCheckApiError(context, error);
        }
    },
    async actionGetUserNotShown(context: MainContext) {
        try {
            const response = await api.notShown(context.state.token);
            
            if (response.data) {
                commitSetUserProfileNotShown(context, response.data);
            }
        } catch (error) {
            await dispatchCheckApiError(context, error);
        }
    },
    async actionSendSympathy(context: MainContext,payload: ISendSympathy) {
        try {
            const response = await api.sendSympathy(context.state.token,payload);
            
            if (response.data) {
                commitSendSympathy(context, response.data);
            }
        } catch (error) {
            await dispatchCheckApiError(context, error);
        }
    },
    async actionGetSympathy(context: MainContext) {
        try {
            const response = await api.getSympathies(context.state.token);
            
            if (response.data) {
                commitGetSympathy(context, response.data);
            }
        } catch (error) {
            await dispatchCheckApiError(context, error);
        }
    },
    async actionUploadUserProfileAvatar(context: MainContext,payload: FormData) {
        try {
            const response = await api.uploadAvatar(context.state.token,payload);
            
            if (response.data){
                commitSetUserProfile(context,response.data);
            }
            
        } catch (error) {
            await dispatchCheckApiError(context, error);
        }
    },
    async actionUpdateUser(context: MainContext, payload) {
        try {
            const loadingNotification = {content: 'saving', showProgress: true};
            commitAddNotification(context, loadingNotification);
            const response = (await Promise.all([
                api.updateMe(context.state.token, payload),
                await new Promise((resolve, reject) => setTimeout(() => resolve("Success"), 500)),
            ]))[0];
            commitSetUser(context, response.data);
            commitRemoveNotification(context, loadingNotification);
            commitAddNotification(context, {content: 'User successfully updated', color: 'success'});
        } catch (error) {
            await dispatchCheckApiError(context, error);
        }
    },
    async actionUpdateUserProfile(context: MainContext, payload) {
        try {
            const loadingNotification = {content: 'Updating', showProgress: true};
            commitAddNotification(context, loadingNotification);
            const response = (await Promise.all([
                api.updateProfile(context.state.token, payload),
                await new Promise((resolve, reject) => setTimeout(() => resolve("Success"), 500)),
            ]))[0];
            commitSetUserProfile(context, response.data as IUserProfile);
            commitRemoveNotification(context, loadingNotification);
            commitAddNotification(context, {content: 'Profile successfully updated', color: 'success'});
        } catch (error) {
            await dispatchCheckApiError(context, error);
        }
    },
    async actionCheckLoggedIn(context: MainContext) {
        if (!context.state.isLoggedIn) {
            let token = context.state.token;
            if (!token) {
                const localToken = getLocalToken();
                if (localToken) {
                    commitSetToken(context, localToken);
                    token = localToken;
                }
            }
            if (token) {
                try {
                    const user = await api.getMe(token);
                    const userProfile = await api.getMyProfile(token);
                    commitSetLoggedIn(context, true);
                    commitSetUser(context, user.data);
                    commitSetUserProfile(context, userProfile.data);
                } catch (error) {
                    await dispatchRemoveLogIn(context);
                }
            } else {
                await dispatchRemoveLogIn(context);
            }
        }
    },
    async actionRemoveLogIn(context: MainContext) {
        removeLocalToken();
        commitSetToken(context, '');
        commitSetLoggedIn(context, false);
    },
    async actionLogOut(context: MainContext) {
        await dispatchRemoveLogIn(context);
        await dispatchRouteLogOut(context);
    },
    async actionUserLogOut(context: MainContext) {
        await dispatchLogOut(context);
        commitAddNotification(context, {content: 'Logged out', color: 'success'});
    },
    actionRouteLogOut(context: MainContext) {
        if (router.currentRoute.path !== '/login') {
            router.push('/login');
        }
    },
    async actionCheckApiError(context: MainContext, payload: AxiosError) {
        if (payload.response!.status === 401) {
            await dispatchLogOut(context);
        }
    },
    actionRouteLoggedIn(context: MainContext) {
        if (router.currentRoute.path === '/login' || router.currentRoute.path === '/') {
            router.push('/main');
        }
    },
    async removeNotification(context: MainContext, payload: { notification: AppNotification, timeout: number }) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                commitRemoveNotification(context, payload.notification);
                resolve(true);
            }, payload.timeout);
        });
    },
    async passwordRecovery(context: MainContext, payload: { username: string }) {
        const loadingNotification = {content: 'Sending password recovery email', showProgress: true};
        try {
            commitAddNotification(context, loadingNotification);
            const response = (await Promise.all([
                api.passwordRecovery(payload.username),
                await new Promise((resolve, reject) => setTimeout(() => resolve("Success"), 500)),
            ]))[0];
            commitRemoveNotification(context, loadingNotification);
            commitAddNotification(context, {content: 'Password recovery email sent', color: 'success'});
            await dispatchLogOut(context);
        } catch (error) {
            commitRemoveNotification(context, loadingNotification);
            commitAddNotification(context, {color: 'error', content: 'Incorrect username'});
        }
    },
    async resetPassword(context: MainContext, payload: { password: string, token: string }) {
        const loadingNotification = {content: 'Resetting password', showProgress: true};
        try {
            commitAddNotification(context, loadingNotification);
            const response = (await Promise.all([
                api.resetPassword(payload.password, payload.token),
                await new Promise((resolve, reject) => setTimeout(() => resolve("Success"), 500)),
            ]))[0];
            commitRemoveNotification(context, loadingNotification);
            commitAddNotification(context, {content: 'Password successfully reset', color: 'success'});
            await dispatchLogOut(context);
        } catch (error) {
            commitRemoveNotification(context, loadingNotification);
            commitAddNotification(context, {color: 'error', content: 'Error resetting password'});
        }
    },
    async actionCreateUserOpen(context: MainContext, payload: IUserCreate) {
        const loadingNotification = { content: 'Registrating', showProgress: true };
        try {
            commitAddNotification(context, loadingNotification);
            const response = (await Promise.all([
                api.createUserOpen(payload),
                await new Promise((resolve, reject) => setTimeout(() => resolve("Success"), 500)),
            ]))[0];
            commitRemoveNotification(context, loadingNotification);
            commitAddNotification(context, { content: 'User successfully created', color: 'success' });
        } catch (error) {     
            commitRemoveNotification(context, loadingNotification);            
            commitAddNotification(context, {color: 'error', content: error}); 
        }
    },
};

const {dispatch} = getStoreAccessors<MainState | any, State>('');

export const dispatchCheckApiError = dispatch(actions.actionCheckApiError);
export const dispatchCheckLoggedIn = dispatch(actions.actionCheckLoggedIn);
export const dispatchGetUser = dispatch(actions.actionGetUser);
export const dispatchGetUserId = dispatch(actions.actionGetUserId);
export const dispatchGetUserProfile = dispatch(actions.actionGetUserProfile);
export const dispatchGetUserProfileNotShown = dispatch(actions.actionGetUserNotShown);
export const dispatchUploadUserAvatar = dispatch(actions.actionUploadUserProfileAvatar);
export const dispatchSympathy = dispatch(actions.actionSendSympathy);
export const dispatchGetympathy = dispatch(actions.actionGetSympathy);
export const dispatchLogIn = dispatch(actions.actionLogIn);
export const dispatchLogOut = dispatch(actions.actionLogOut);
export const dispatchUserLogOut = dispatch(actions.actionUserLogOut);
export const dispatchRemoveLogIn = dispatch(actions.actionRemoveLogIn);
export const dispatchRouteLoggedIn = dispatch(actions.actionRouteLoggedIn);
export const dispatchRouteLogOut = dispatch(actions.actionRouteLogOut);
export const dispatchUpdateUser = dispatch(actions.actionUpdateUser);
export const dispatchUpdateUserProfile = dispatch(actions.actionUpdateUserProfile);
export const dispatchRemoveNotification = dispatch(actions.removeNotification);
export const dispatchPasswordRecovery = dispatch(actions.passwordRecovery);
export const dispatchResetPassword = dispatch(actions.resetPassword);
export const dispatchCreateUserOpen = dispatch(actions.actionCreateUserOpen);
