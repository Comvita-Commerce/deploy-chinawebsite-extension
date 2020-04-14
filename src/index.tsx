import * as React from 'react';
import { render } from 'react-dom';
import { Button, TextInput } from '@contentful/forma-36-react-components';
import {
    init,
    locations,
    SidebarExtensionSDK
} from 'contentful-ui-extensions-sdk';
import '@contentful/forma-36-react-components/dist/styles.css';
import './index.css';

export class ObjectUtils {
    static getIn(obj: any, path: string, def?: any) {
        try {
            /**
         * If the path is a string, convert it to an array
         * @param  {String|Array} path The path
         * @return {Array}             The path array
         */
            var stringToPath = function (path: string) {
                // If the path isn't a string, return it
                if (typeof path !== 'string') return path;
                // Create new array
                var output: any = [];
                // Split to an array with dot notation
                path.split('.').forEach(function (item, index) {

                    // Split to an array with bracket notation
                    item.split(/\[([^}]+)\]/g).forEach(function (key) {

                        // Push to the new array
                        if (key.length > 0) {
                            output.push(key);
                        }

                    });
                });
                return output;
            };

            // Get the path as an array
            path = stringToPath(path);
            // Cache the current object
            var current: any = obj;
            // For each item in the path, dig into the object
            for (var i = 0; i < path.length; i++) {
                // If the item isn't found, return the default (or null)
                if (typeof current[path[i]] === 'undefined') return def;
                // Otherwise, update the current  value
                current = current[path[i]];
            }
            return current;
        } catch (error) {
            return;
        }
    };
}

const base64 = require('base-64');

export class SidebarExtension extends React.Component<{
    sdk: SidebarExtensionSDK;
}> {
    constructor(props: any) {
        super(props);
        this.state = {
            isLoading: false,
            accessToken: 'upra2lhwzbceyj2c5cwjf7c366lnola4tyy6jezhhbi5igxkh4oa'
        };
    }

    componentDidMount() {
        this.props.sdk.window.startAutoResizer();
    }

    onButtonClick = async (sourceBranch: 'develop' | 'release/uat' | 'master') => {
        this.setState({ isLoading: true })

        const url = 'https://dev.azure.com/comvitaintegration/Comvita%20Development/_apis/build/builds?api-version=5.1';
        const username = 'basic';
        const password = this.getAccessToken();
        const body = {
            definition: {
                id: 106
            },
            sourceBranch
        }

        await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + base64.encode(username + ":" + password)
            },
            body: JSON.stringify(body)
        })
            .then(async response => {
                const data = await response.json();

                if (!response.ok) {
                    // Handle error
                    const message = ObjectUtils.getIn(data, 'message', 'Something went wrong...')
                    this.props.sdk.notifier.error(message)
                } else {
                    // Handle success
                    this.props.sdk.notifier.success(`Activate queue a new build for branch name: ${sourceBranch} successful!`)
                }
            })
            .catch(err => {
                // Error when run fetch
                this.props.sdk.notifier.error(err.message)
            })

        this.setState({ isLoading: false })
    };

    onChangeAccessToken = (e: any) => {
        return this.setState({ accessToken: e.target.value })
    }

    getAccessToken() {
        // @ts-ignore
        return this.state.accessToken || ''
    }

    render() {
        return (
            <React.Fragment>
                {(() => {
                    // @ts-ignore
                    if (this.state.isLoading) return <React.Fragment>
                        Waiting for response...
                    </React.Fragment>

                    return <React.Fragment>
                        <div style={{ marginBottom: '10px', width: '100%' }}>
                            <p className="label">Access token:</p>
                            <TextInput type="text" defaultValue={this.getAccessToken()} onChange={this.onChangeAccessToken} />
                        </div>

                        <div style={{ marginBottom: '10px' }}>
                            <Button
                                testId="open-dialog"
                                buttonType="positive"
                                isFullWidth={true}
                                onClick={() => this.onButtonClick('develop')}>
                                Queue a new build for DEV
                            </Button>
                        </div>

                        <div style={{ marginBottom: '10px' }}>
                            <Button
                                testId="open-dialog"
                                buttonType="positive"
                                isFullWidth={true}
                                onClick={() => this.onButtonClick('release/uat')}>
                                Queue a new build for UAT
                            </Button>
                        </div>

                        <div style={{ marginBottom: '10px' }}>
                            <Button
                                testId="open-dialog"
                                buttonType="positive"
                                isFullWidth={true}
                                onClick={() => this.onButtonClick('master')}>
                                Queue a new build for PROD
                            </Button>
                        </div>
                    </React.Fragment>
                })()}
            </React.Fragment>
        );
    }
}

init(sdk => {
    if (sdk.location.is(locations.LOCATION_DIALOG)) {
        // render(<DialogExtension sdk={sdk as DialogExtensionSDK} />, document.getElementById('root'));
    } else {
        render(<SidebarExtension sdk={sdk as SidebarExtensionSDK} />, document.getElementById('root'));
    }
});

/**
 * By default, iframe of the extension is fully reloaded on every save of a source file.
 * If you want to use HMR (hot module reload) instead of full reload, uncomment the following lines
 */
// if (module.hot) {
//   module.hot.accept();
// }
