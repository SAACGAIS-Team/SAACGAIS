import {
    CognitoIdentityProviderClient,
    AdminGetUserCommand,
    AdminUpdateUserAttributesCommand,
    AdminSetUserPasswordCommand,
    ListUsersInGroupCommand,
    ListUsersCommand,
    ListGroupsCommand,
    AdminListGroupsForUserCommand,
    AdminAddUserToGroupCommand,
    AdminRemoveUserFromGroupCommand,
    InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";

let _client = null;

function getClient() {
    if (!_client) {
        _client = new CognitoIdentityProviderClient({
            region: process.env.AWS_COGNITO_REGION,
            credentials: {
                accessKeyId: process.env.AWS_BACKEND_KEY,
                secretAccessKey: process.env.AWS_BACKEND_SECRET,
            },
        });
    }
    return _client;
}

const USER_POOL_ID = () => process.env.AWS_COGNITO_USER_POOL_ID;
const CLIENT_ID = () => process.env.AWS_COGNITO_CLIENT_ID;

export function attrsToObj(attributes) {
    return Object.fromEntries(attributes.map((a) => [a.Name, a.Value]));
}

export function formatUser(attrs, username) {
    return {
        sub: username,
        firstName: attrs.given_name || null,
        lastName: attrs.family_name || null,
        email: attrs.email || null,
        phone: attrs.phone_number || null,
        birthdate: attrs.birthdate || null,
    };
}

export async function sendCommand(command) {
    return await getClient().send(command);
}

export async function getUserById(userId) {
    const command = new AdminGetUserCommand({
        UserPoolId: USER_POOL_ID(),
        Username: userId,
    });
    const user = await getClient().send(command);
    const attrs = attrsToObj(user.UserAttributes);
    return {
        ...formatUser(attrs, userId),
        enabled: user.Enabled,
        status: user.UserStatus,
    };
}

export async function listUsersInGroup(groupName) {
    const command = new ListUsersInGroupCommand({
        UserPoolId: USER_POOL_ID(),
        GroupName: groupName,
        Limit: 60,
    });
    const response = await getClient().send(command);
    return (response.Users || []).map((u) =>
        formatUser(attrsToObj(u.Attributes), u.Username)
    );
}

export async function listAllUsers() {
    const command = new ListUsersCommand({
        UserPoolId: USER_POOL_ID(),
        Limit: 60,
    });
    const response = await getClient().send(command);
    return (response.Users || []).map((u) =>
        formatUser(attrsToObj(u.Attributes), u.Username)
    );
}

export async function listGroups() {
    const command = new ListGroupsCommand({
        UserPoolId: USER_POOL_ID(),
        Limit: 60,
    });
    const response = await getClient().send(command);
    return response.Groups || [];
}

export async function getUserGroups(userId) {
    const command = new AdminListGroupsForUserCommand({
        UserPoolId: USER_POOL_ID(),
        Username: userId,
    });
    const response = await getClient().send(command);
    return (response.Groups || []).map((g) => g.GroupName);
}

export async function setUserGroups(userId, newGroups) {
    const existing = await getUserGroups(userId);
    for (const group of existing) {
        await getClient().send(new AdminRemoveUserFromGroupCommand({
            UserPoolId: USER_POOL_ID(),
            Username: userId,
            GroupName: group,
        }));
    }
    for (const group of newGroups) {
        await getClient().send(new AdminAddUserToGroupCommand({
            UserPoolId: USER_POOL_ID(),
            Username: userId,
            GroupName: group,
        }));
    }
}

export async function updateUserAttributes(userId, attributes) {
    await getClient().send(new AdminUpdateUserAttributesCommand({
        UserPoolId: USER_POOL_ID(),
        Username: userId,
        UserAttributes: Object.entries(attributes).map(([Name, Value]) => ({ Name, Value })),
    }));
}

export async function verifyPassword(email, password) {
    await getClient().send(new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: CLIENT_ID(),
        AuthParameters: { USERNAME: email, PASSWORD: password },
    }));
}

export async function setUserPassword(userId, password) {
    await getClient().send(new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID(),
        Username: userId,
        Password: password,
        Permanent: true,
    }));
}