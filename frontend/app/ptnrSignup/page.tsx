"use client"
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { AuthType } from '@particle-network/auth-core';
import {
    isValidE164PhoneNumber,
    isValidEmail,
    useConnect,
    useCustomize,
    type ConnectOptions,
} from '@particle-network/auth-core-modal';
import { ParticleChains, chains, type Chain } from '@particle-network/chains';
import { Button, Input, Popover, Select, Switch, message } from 'antd';

import { useRef, useState } from 'react';
import WalletInfo from '../components/WalletInfo';

const loginMethods = [
    {
        type: AuthType.email,
        icon: require('../../assets/logo/email_icon.png').default.src,
    },
    {
        type: AuthType.phone,
        icon: require('../../assets/logo/phone_icon.png').default.src,
    },
    {
        type: AuthType.google,
        icon: require('../../assets/logo/google_icon.png').default.src,
    },
    {
        type: AuthType.apple,
        icon: require('../../assets/logo/apple_icon.png').default.src,
    },
      
];

const ConnectDashboard = () => {
    const [loginLoading, setLoginLoading] = useState(false);
    const [codeLoading, setCodeLoading] = useState(false);
    const [authorize, setAuthorize] = useState(false);
    const [authorizeUniq, setAuthorizeUniq] = useState(false);
    const [loginAccount, setLoginAccount] = useState<string>();
    const [authorizeMessage, setAuthorizeMessage] = useState<string>();
    const [connectChain, setConnectChain] = useState<Chain>();
    const [selectAuthType, setSelectAuthType] = useState<AuthType.email | AuthType.phone>(
        AuthType.email
    );
    const [isConnected, setIsConnected] = useState(false);
    const [isGoogle, setIsGoogle] = useState(false);
const { disconnect } = useConnect();


    const { themeType, language } = useCustomize();

    const [verifyCode, setVerifyCode] = useState<string>();

    const { connect, requestConnectCaptcha, connectionStatus } = useConnect();

    const [oauthPrompt, setOAuthPrompt] = useState<'none' | 'consent' | 'select_account'>('none');

    const containerRef = useRef<HTMLDivElement>(null);

    const connectWallet = (authType: AuthType) => {
        if (verifyCode && !verifyCode.match(/^\d{6}$/)) {
            message.error('Please input valid code');
            return;
        }
        let authorization;
        if (authorize) {
            if (connectChain?.name === 'Solana' && !authorizeMessage) {
                message.error('Please input message to be signed');
                return;
            }
            authorization = {
                uniq: authorizeUniq,
                message: authorizeMessage,
            };
        }
        let options: ConnectOptions = {
            authorization,
            chain: connectChain,
        };
        if (authType === AuthType.email) {
            if (loginAccount && !isValidEmail(loginAccount)) {
                message.error('Please input valid email address');
                return;
            }
            options = {
                ...options,
                email: loginAccount,
                code: verifyCode,
            };
        } else if (authType === AuthType.phone) {
            if (loginAccount && !isValidE164PhoneNumber(loginAccount)) {
                message.error('Please input valid phone number');
                return;
            }
            options = {
                ...options,
                phone: loginAccount || '',
                code: verifyCode,
            };
        } else if (authType === AuthType.jwt) {
            if (!loginAccount) {
                message.error('Please input valid jwt');
                return;
            }
            options = {
                ...options,
                jwt: loginAccount,
            };
        }
        setLoginLoading(true);
        connect(options)
            .then(() => {
                console.log('connect success');
                setTimeout(() => {
                    console.log(connectionStatus)
                }, 4000)
                setIsConnected(true);
            })
            .catch((error: Error) => {
                console.log('connect error', error);
                message.error(error.message);
            })
            .finally(() => {
                setLoginLoading(false);
                
            });
    };

    const onConnectChainChange = (value: string) => {
        console.log('onConnectChainChange', value);
        if (value === 'none') {
            setConnectChain(undefined);
            setAuthorize(false);
        } else {
            setConnectChain(ParticleChains[value]);
        }
    };

    const connectAuthCore = (authType: AuthType) => {
        if (authType === AuthType.email || authType === AuthType.phone) {
            setLoginAccount(undefined);
            setVerifyCode(undefined);
            // @ts-ignore
            setSelectAuthType(authType);
            return;
        }
        let authorization;
        if (authorize) {
            if (connectChain?.name === 'Solana' && !authorizeMessage) {
                message.error('Please input message to be signed');
                return;
            }
            authorization = {
                uniq: authorizeUniq,
                message: authorizeMessage,
            };
        }
        connect({
            authorization,
            chain: connectChain,
            socialType: authType,
            prompt: oauthPrompt === 'none' ? undefined : oauthPrompt,
        }).then(() => {
            setTimeout(() => {
                message.success('Connect success');
                setIsConnected(true);
            }, 10000);
                
            })
            .catch((error: any) => {
                message.error(error.message || error);
            });
            
    };

    const disconnectAuthCore = () => {
        disconnect();
        setIsConnected(false);
    };

    const getVerifyCode = async () => {
        let options;
        if (selectAuthType === AuthType.email && loginAccount && isValidEmail(loginAccount)) {
            options = {
                email: loginAccount,
            };
        } else if (selectAuthType === AuthType.phone && loginAccount && isValidE164PhoneNumber(loginAccount)) {
            options = {
                phone: loginAccount,
                cloudflareOptions: {
                    theme: themeType,
                    language,
                    getContainer: () => document.querySelector('.login-box') as HTMLElement,
                },
            };
        }

        if (options) {
            setCodeLoading(true);
            try {
                await requestConnectCaptcha(options);
                message.success('send captcha success');
            } catch (error: any) {
                message.error(error.message || error);
            }
            setCodeLoading(false);
        } else {
            message.error('Please input valid account');
        }
    };

    return (
        !isConnected ? (
        <div className="login-box card">
            <h2 className="login-box-title">Connect Auth Core</h2>

            <div className="login-option-item">
                Connect Chain
                <Select
                    showSearch
                    defaultValue="none"
                    style={{ width: 140 }}
                    onChange={onConnectChainChange}
                    filterOption={(input, option) => {
                        return (option?.label ?? '').toLowerCase().includes(input.toLowerCase());
                    }}
                    getPopupContainer={(triggerNode) => triggerNode.parentNode}
                    options={[
                        { value: 'none', label: 'None' },
                        ...chains.getAllChainInfos().map((chain) => {
                            return {
                                value: `${chain.name.toLowerCase()}-${chain.id}`,
                                label: `${chain.name}-${chain.id}`,
                            };
                        }),
                    ]}
                />
            </div>

            <div className="login-option-item">
                Authorize
                <Switch
                    checked={authorize}
                    defaultChecked={authorize}
                    onChange={(checked: boolean) => {
                        if (!connectChain) {
                            setAuthorize(false);
                            message.warning('Please select a connect chain first');
                        } else {
                            setAuthorize(checked);
                        }
                    }}
                ></Switch>
            </div>

            {authorize && (
                <>
                    <div className="login-option-item">
                        Unique
                        <Switch
                            checked={authorizeUniq}
                            defaultChecked={authorizeUniq}
                            onChange={(checked: boolean) => setAuthorizeUniq(checked)}
                        ></Switch>
                    </div>
                    {connectChain?.name === 'Solana' && (
                        <Input.TextArea
                            className="authorize-message-input"
                            placeholder="Message to be signed"
                            value={authorizeMessage}
                            autoSize={true}
                            onChange={(e) => setAuthorizeMessage(e.target.value)}
                        ></Input.TextArea>
                    )}
                </>
            )}

            <div className="login-option-item">
                <div>
                    OAuth Prompt
                    <Popover content={<div style={{ padding: 10 }}>Only Google/Discord/Microsoft support it.</div>}>
                        <ExclamationCircleOutlined style={{ marginLeft: 4, color: '#40a9ff' }} />
                    </Popover>
                </div>
                <Select
                    defaultValue={oauthPrompt}
                    style={{ width: 140 }}
                    onChange={setOAuthPrompt}
                    getPopupContainer={(triggerNode) => triggerNode.parentNode}
                    options={[
                        { value: 'none', label: 'none' },
                        { value: 'consent', label: 'consent' },
                        { value: 'select_account', label: 'select_account' },
                    ]}
                />
            </div>

            {selectAuthType !== AuthType.jwt && (
                <>
                    <p className="center-center" style={{ marginTop: 16, marginBottom: 6 }}>
                        <Input
                            className="input-account"
                            value={loginAccount}
                            onChange={(e) => setLoginAccount(e.target.value)}
                            placeholder={
                                selectAuthType === AuthType.email ? 'email address (optional)' : 'E.164 phone number'
                            }
                        />
                    </p>
                    <p className="center-center" style={{ marginTop: 0 }}>
                        <Input
                            className="input-account"
                            value={verifyCode}
                            onChange={(e) => setVerifyCode(e.target.value)}
                            placeholder="code (optional)"
                        />
                        <Button type="primary" style={{ marginLeft: 5 }} onClick={getVerifyCode} loading={codeLoading}>
                            GET
                        </Button>
                    </p>
                    <div ref={containerRef}></div>
                </>
            )}

            {/* {selectAuthType === AuthType.jwt && (
                <p className="center-center" style={{ marginTop: 16 }}>
                    <Input.TextArea
                        className="input-account"
                        value={loginAccount}
                        onChange={(e) => setLoginAccount(e.target.value)}
                        placeholder="Json Web Token"
                    />
                </p>
            )} */}

            <p className="center-center">
                <Button
                    loading={loginLoading || connectionStatus === 'connecting'}
                    type="primary"
                    className="login-button"
                    onClick={() => connectWallet(selectAuthType)}
                >
                    Connect
                </Button>
            </p>

            <div className="login-methods">
                {loginMethods.map((item, index) => {
                    return (
                        <img
                            key={index}
                            className="method-item"
                            src={loginMethods[index].icon}
                            alt=""
                            onClick={() => connectAuthCore(item.type)}
                        />
                    );
                })}
         
            <Button onClick={disconnectAuthCore}>Disconnect</Button>

            </div>
        </div>
        ) : (
            <WalletInfo />
        )
    ) 
};

export default ConnectDashboard;